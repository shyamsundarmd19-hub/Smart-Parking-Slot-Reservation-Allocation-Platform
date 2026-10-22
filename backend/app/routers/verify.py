from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.parking import ParkingLot, Slot
from app.models.reservation import Reservation
from app.models.audit import AuditLog
from app.schemas.reservation import ScanPassResponse, ReservationResponse

router = APIRouter(prefix="/verify", tags=["Pass Verification & Scanner"])


@router.get("/scan-pass/{pass_hash}", response_model=ScanPassResponse)
def scan_and_verify_pass(
    pass_hash: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Attendant / Gate Scanner Endpoint:
    Validates QR pass authenticity, auto-transitions status:
    - 'booked' -> 'checked_in' (Vehicle Enters)
    - 'checked_in' -> 'completed' (Vehicle Exits & slot is released back to lot pool)
    """
    reservation = db.query(Reservation).filter(Reservation.pass_hash == pass_hash).first()
    if not reservation:
        return ScanPassResponse(
            valid=False,
            message="Invalid QR Code. No matching parking reservation found.",
            action_taken="INVALID",
        )

    slot = db.query(Slot).filter(Slot.id == reservation.slot_id).first()
    lot = db.query(ParkingLot).filter(ParkingLot.id == slot.lot_id).first() if slot else None
    driver = db.query(User).filter(User.id == reservation.user_id).first()

    driver_name = driver.name if driver else "Unknown"
    lot_name = lot.lot_name if lot else "Unknown Lot"
    slot_number = slot.slot_number if slot else "N/A"

    if reservation.status == "cancelled":
        return ScanPassResponse(
            valid=False,
            message="This reservation has been cancelled and cannot be used.",
            action_taken="CANCELLED",
            reservation=ReservationResponse.model_validate(reservation),
            slot_number=slot_number,
            lot_name=lot_name,
            driver_name=driver_name,
        )

    if reservation.status == "completed":
        return ScanPassResponse(
            valid=False,
            message="Pass has already been completed and vehicle has exited.",
            action_taken="ALREADY_COMPLETED",
            reservation=ReservationResponse.model_validate(reservation),
            slot_number=slot_number,
            lot_name=lot_name,
            driver_name=driver_name,
        )

    # State Machine Transition: Gate Entry (Check In)
    if reservation.status == "booked":
        reservation.status = "checked_in"
        audit = AuditLog(
            user_id=current_user.id,
            action="CHECK_IN_ATTENDANT",
            details=f"Vehicle {reservation.vehicle_number} checked in at slot {slot_number} by {current_user.name} ({current_user.role})",
        )
        db.add(audit)
        db.commit()
        db.refresh(reservation)

        return ScanPassResponse(
            valid=True,
            message=f"Check-In Verified: Vehicle {reservation.vehicle_number} granted entry to slot {slot_number}.",
            action_taken="CHECK_IN",
            reservation=ReservationResponse.model_validate(reservation),
            slot_number=slot_number,
            lot_name=lot_name,
            driver_name=driver_name,
        )

    # State Machine Transition: Gate Exit (Check Out & Free Slot)
    if reservation.status == "checked_in":
        reservation.status = "completed"
        if slot:
            slot.is_occupied = False
            if lot:
                lot.available_slots = min(lot.total_slots, lot.available_slots + 1)

        audit = AuditLog(
            user_id=current_user.id,
            action="CHECK_OUT_ATTENDANT",
            details=f"Vehicle {reservation.vehicle_number} checked out of slot {slot_number}. Slot released.",
        )
        db.add(audit)
        db.commit()
        db.refresh(reservation)

        return ScanPassResponse(
            valid=True,
            message=f"Check-Out Complete: Slot {slot_number} successfully released back to lot pool.",
            action_taken="CHECK_OUT",
            reservation=ReservationResponse.model_validate(reservation),
            slot_number=slot_number,
            lot_name=lot_name,
            driver_name=driver_name,
        )

    return ScanPassResponse(
        valid=False,
        message=f"Unknown reservation state: {reservation.status}",
        action_taken="UNKNOWN",
    )
