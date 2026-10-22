"""
ParkCloud Load Testing & Performance Benchmark Script
Simulates concurrent drivers and gate attendants interacting with ParkCloud API.
Designed for Locust: 100 to 1,000 concurrent users.

Usage:
  1. Install Locust:
     pip install locust

  2. Interactive Web UI:
     locust -f locustfile.py --host http://<EC2-PUBLIC-IP>

  3. Headless Mode (Generates HTML Report and CSVs for evaluation report):
     locust -f locustfile.py --host http://<EC2-PUBLIC-IP> \
       --users 500 \
       --spawn-rate 50 \
       --run-time 2m \
       --headless \
       --html load_test_report.html \
       --csv load_test_metrics
"""

import uuid
import random
from datetime import datetime, timedelta
from locust import HttpUser, task, between, tag


class DriverUser(HttpUser):
    # Wait between 1 and 3 seconds between actions to simulate real user thinking time
    wait_time = between(1, 3)
    token = None
    user_id = None
    booked_reservations = []

    def on_start(self):
        """Simulate driver registration and login on launch."""
        self.email = f"driver_{uuid.uuid4().hex[:8]}@loadtest.app"
        self.password = "LoadPass123!"

        # Register Driver
        reg_payload = {
            "name": f"Tester {random.randint(100, 999)}",
            "email": self.email,
            "phone": f"+1555{random.randint(1000000, 9999999)}",
            "role": "driver",
            "password": self.password,
        }
        res = self.client.post("/api/auth/register", json=reg_payload)
        if res.status_code == 201:
            data = res.json()
            self.token = data.get("access_token")
            self.user_id = data.get("user", {}).get("id")
        else:
            # Fallback to login
            login_res = self.client.post("/api/auth/login", json={"email": self.email, "password": self.password})
            if login_res.status_code == 200:
                self.token = login_res.json().get("access_token")

    @property
    def headers(self):
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}

    @task(5)
    @tag("browse")
    def browse_parking_lots(self):
        """Step 1: Driver searches for available parking lots (Highest Frequency)."""
        with self.client.get("/api/parking-lots", headers=self.headers, catch_response=True) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Failed to fetch parking lots: {resp.status_code}")

    @task(4)
    @tag("inspect_grid")
    def inspect_slot_grid(self):
        """Step 2: Driver opens a lot to inspect the visual slot grid."""
        # Fetch lots first
        res = self.client.get("/api/parking-lots", headers=self.headers)
        if res.status_code == 200:
            lots = res.json()
            if lots:
                lot = random.choice(lots)
                with self.client.get(f"/api/slots/lot/{lot['id']}", headers=self.headers, catch_response=True) as grid_resp:
                    if grid_resp.status_code == 200:
                        grid_resp.success()
                    else:
                        grid_resp.failure(f"Grid fetch failed for lot {lot['id']}")

    @task(2)
    @tag("reservation")
    def book_available_slot(self):
        """Step 3: Driver books an available slot, triggers S3 pass generation & SES."""
        res = self.client.get("/api/parking-lots", headers=self.headers)
        if res.status_code != 200 or not res.json():
            return

        lot = random.choice(res.json())
        grid_res = self.client.get(f"/api/slots/lot/{lot['id']}", headers=self.headers)
        if grid_res.status_code != 200:
            return

        slots = grid_res.json().get("slots", [])
        available_slots = [s for s in slots if not s.get("is_occupied")]

        if not available_slots:
            return  # Lot full

        chosen_slot = random.choice(available_slots)
        start_time = datetime.utcnow()
        end_time = start_time + timedelta(hours=random.randint(1, 4))
        vehicle_num = f"LOAD-{random.choice(['KA', 'DL', 'MH', 'CA'])}-{random.randint(1000, 9999)}"

        booking_payload = {
            "slot_id": chosen_slot["id"],
            "vehicle_number": vehicle_num,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "payment_method": "UPI / Card",
        }

        with self.client.post("/api/reservations", json=booking_payload, headers=self.headers, catch_response=True) as book_resp:
            if book_resp.status_code == 201:
                data = book_resp.json()
                self.booked_reservations.append(data)
                book_resp.success()
            elif book_resp.status_code == 400 and "occupied" in book_resp.text:
                # Concurrent race condition: Another driver snagged the slot first
                book_resp.success()
            else:
                book_resp.failure(f"Booking error {book_resp.status_code}: {book_resp.text}")

    @task(3)
    @tag("passes")
    def view_my_passes(self):
        """Step 4: Driver views their active passes and downloads tickets."""
        with self.client.get("/api/reservations", headers=self.headers, catch_response=True) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Failed to view passes: {resp.status_code}")


class GateAttendantUser(HttpUser):
    """Simulates attendants scanning driver QR passes at lot gates."""
    wait_time = between(2, 5)
    token = None

    def on_start(self):
        self.email = f"attendant_{uuid.uuid4().hex[:6]}@loadtest.app"
        reg_payload = {
            "name": "Gate Attendant 1",
            "email": self.email,
            "role": "attendant",
            "password": "AttendantPass123!",
        }
        res = self.client.post("/api/auth/register", json=reg_payload)
        if res.status_code == 201:
            self.token = res.json().get("access_token")

    @property
    def headers(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(3)
    def scan_driver_qr_pass(self):
        """Attendant scans incoming vehicle passes."""
        # Fetch active reservations to simulate scanning valid passes
        res = self.client.get("/api/reservations", headers=self.headers)
        if res.status_code == 200 and res.json():
            sample_res = random.choice(res.json())
            pass_hash = sample_res.get("pass_hash")
            if pass_hash:
                with self.client.get(f"/api/verify/scan-pass/{pass_hash}", headers=self.headers, catch_response=True) as scan_resp:
                    if scan_resp.status_code == 200:
                        scan_resp.success()
                    else:
                        scan_resp.failure(f"Scan validation failed: {scan_resp.status_code}")
