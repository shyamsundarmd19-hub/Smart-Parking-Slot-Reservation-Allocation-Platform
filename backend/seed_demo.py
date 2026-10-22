"""Seed initial demo accounts and parking lots for local testing."""
from app.core.database import Base, engine, SessionLocal
import app.models
from app.models.user import User
from app.models.parking import ParkingLot, Slot
from app.core.security import get_password_hash

# Create tables
Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Create Demo Users
demo_users = [
    {
        "name": "Alex Driver",
        "email": "driver@parkcloud.app",
        "role": "driver",
        "phone": "+1 (555) 019-2834",
    },
    {
        "name": "Marcus Gate Attendant",
        "email": "attendant@parkcloud.app",
        "role": "attendant",
        "phone": "+1 (555) 482-1920",
    },
    {
        "name": "Sarah Administrator",
        "email": "admin@parkcloud.app",
        "role": "admin",
        "phone": "+1 (555) 902-3341",
    },
]

pwd_hash = get_password_hash("password123")

for u_data in demo_users:
    existing = db.query(User).filter(User.email == u_data["email"]).first()
    if not existing:
        user = User(
            name=u_data["name"],
            email=u_data["email"],
            phone=u_data["phone"],
            role=u_data["role"],
            password_hash=pwd_hash,
        )
        db.add(user)

# Create Demo Parking Lots
if db.query(ParkingLot).count() == 0:
    sample_lots = [
        {
            "name": "Central Plaza Garage",
            "location": "Downtown Metro Hub, Sector 4",
            "total_slots": 24,
            "hourly_rate": 25.0,
        },
        {
            "name": "Skyline Tech Park Parking",
            "location": "Tech Corridor, Gate 2",
            "total_slots": 30,
            "hourly_rate": 18.0,
        },
        {
            "name": "Airport Express Terminal",
            "location": "Terminal 1 Long-term Lot B",
            "total_slots": 20,
            "hourly_rate": 35.0,
        },
    ]

    for lot_data in sample_lots:
        lot = ParkingLot(
            lot_name=lot_data["name"],
            location=lot_data["location"],
            total_slots=lot_data["total_slots"],
            available_slots=lot_data["total_slots"],
            hourly_rate=lot_data["hourly_rate"],
            is_active=True,
        )
        db.add(lot)
        db.flush()

        # Slots
        for i in range(1, lot_data["total_slots"] + 1):
            sec = chr(65 + ((i - 1) // 10))
            num = 100 + ((i - 1) % 10) + 1
            stype = "EV" if i % 6 == 0 else ("bike" if i % 3 == 0 else "car")
            is_occ = (i % 7 == 0)  # Make a couple occupied for realistic visual demo
            slot = Slot(
                lot_id=lot.id,
                slot_number=f"{sec}-{num}",
                slot_type=stype,
                is_occupied=is_occ,
            )
            db.add(slot)
            if is_occ:
                lot.available_slots = max(0, lot.available_slots - 1)

db.commit()
print("Seed data successfully initialized!")
db.close()
