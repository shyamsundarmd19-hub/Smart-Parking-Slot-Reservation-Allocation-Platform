from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from collections import defaultdict

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.models.parking import ParkingLot, Slot
from app.models.reservation import Reservation, Payment
from app.models.audit import AuditLog
from app.schemas.analytics import AnalyticsResponse, OccupancyMetric, PeakHourStat

router = APIRouter(prefix="/admin", tags=["Admin & Analytics"])


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin", "attendant"])),
):
    """
    Returns parking lot occupancy rates, total revenue, peak hour booking distributions,
    and recent financial transactions for the administrative dashboard.
    """
    # 1. Revenue & Bookings
    total_revenue_result = db.query(func.sum(Payment.amount)).filter(Payment.status == "successful").scalar()
    total_revenue = float(total_revenue_result or 0.0)

    total_bookings = db.query(Reservation).count()
    active_reservations = db.query(Reservation).filter(
        Reservation.status.in_(["booked", "checked_in"])
    ).count()

    # 2. Lot Occupancy Metrics
    lots = db.query(ParkingLot).all()
    lot_metrics: List[OccupancyMetric] = []
    total_capacity = 0
    total_occupied = 0

    for lot in lots:
        occupied_count = db.query(Slot).filter(
            Slot.lot_id == lot.id,
            Slot.is_occupied == True,
        ).count()
        
        rate = round((occupied_count / lot.total_slots) * 100, 1) if lot.total_slots > 0 else 0.0
        
        lot_metrics.append(OccupancyMetric(
            lot_id=lot.id,
            lot_name=lot.lot_name,
            total_slots=lot.total_slots,
            occupied_slots=occupied_count,
            occupancy_rate=rate,
        ))
        
        total_capacity += lot.total_slots
        total_occupied += occupied_count

    overall_occupancy_rate = round((total_occupied / total_capacity) * 100, 1) if total_capacity > 0 else 0.0

    # 3. Peak Hour Booking Statistics
    reservations = db.query(Reservation.start_time).all()
    hour_counts = defaultdict(int)
    for (start_t,) in reservations:
        if start_t:
            hour_counts[start_t.hour] += 1

    peak_hours = [
        PeakHourStat(hour=h, booking_count=hour_counts[h])
        for h in range(24)
    ]

    # 4. Recent Transactions
    payments = db.query(Payment, Reservation, User).join(
        Reservation, Payment.reservation_id == Reservation.id
    ).join(
        User, Reservation.user_id == User.id
    ).order_by(Payment.timestamp.desc()).limit(8).all()

    recent_transactions: List[Dict[str, Any]] = [
        {
            "id": p.id,
            "transaction_id": p.transaction_id,
            "driver_name": u.name,
            "vehicle_number": r.vehicle_number,
            "amount": p.amount,
            "payment_method": p.payment_method,
            "status": p.status,
            "timestamp": p.timestamp.isoformat(),
        }
        for p, r, u in payments
    ]

    return AnalyticsResponse(
        total_revenue=total_revenue,
        total_bookings=total_bookings,
        active_reservations=active_reservations,
        overall_occupancy_rate=overall_occupancy_rate,
        lot_metrics=lot_metrics,
        peak_hours=peak_hours,
        recent_transactions=recent_transactions,
    )


@router.post("/seed", status_code=status.HTTP_201_CREATED)
def seed_sample_data(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"])),
):
    """
    Seed initial sample parking facilities, slots, and pricing for testing.
    """
    existing_lot = db.query(ParkingLot).first()
    if existing_lot:
        return {"message": "Database already contains parking lot data."}

    sample_lots = [
        {
            "name": "Central Plaza Garage",
            "location": "Downtown Metro Hub, Sector 4",
            "total_slots": 30,
            "hourly_rate": 25.0,
        },
        {
            "name": "Skyline Tech Park Parking",
            "location": "Tech Corridor, Gate 2",
            "total_slots": 40,
            "hourly_rate": 18.0,
        },
        {
            "name": "Airport Express Terminal",
            "location": "Terminal 1 Long-term Lot B",
            "total_slots": 25,
            "hourly_rate": 35.0,
        },
    ]

    created_lots = []
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

        # Create slots
        slots = []
        for i in range(1, lot_data["total_slots"] + 1):
            sec = chr(65 + ((i - 1) // 15))
            num = 100 + ((i - 1) % 15) + 1
            stype = "EV" if i % 8 == 0 else ("bike" if i % 4 == 0 else "car")
            slots.append(Slot(
                lot_id=lot.id,
                slot_number=f"{sec}-{num}",
                slot_type=stype,
                is_occupied=False,
            ))
        db.add_all(slots)
        created_lots.append(lot.lot_name)

    db.commit()
    return {"message": "Sample parking lots and slots successfully seeded!", "lots": created_lots}
