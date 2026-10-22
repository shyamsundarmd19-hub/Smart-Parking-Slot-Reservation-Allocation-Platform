import uuid
import math
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.parking import ParkingLot, Slot
from app.models.reservation import Reservation, Payment
from app.models.audit import AuditLog
from app.schemas.reservation import ReservationCreate, ReservationResponse
from app.services.s3_service import s3_service
from app.services.qr_pdf_service import qr_pdf_service
from app.services.ses_service import ses_service

router = APIRouter(prefix="/reservations", tags=["Reservations"])


@router.post("", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
def create_reservation(
    res_in: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Book a parking slot:
    1. Validates slot and calculates pricing.
    2. Marks slot as occupied and generates transaction record.
    3. Generates QR Pass PDF with ReportLab.
    4. Uploads PDF to AWS S3 with SSE-S3 AES-256 encryption.
    5. Dispatches confirmation email ticket via AWS SES.
    """
    # 1. Fetch slot & lot
    slot = db.query(Slot).filter(Slot.id == res_in.slot_id).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking slot not found.")
    
    if slot.is_occupied:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This slot has already been occupied or reserved.")

    lot = db.query(ParkingLot).filter(ParkingLot.id == slot.lot_id).first()
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated parking lot not found.")

    # 2. Calculate duration and total amount
    # Ensure times are aware or naive consistently
    duration_seconds = (res_in.end_time - res_in.start_time).total_seconds()
    if duration_seconds <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End time must be after start time.")
    
    hours = max(1, math.ceil(duration_seconds / 3600))
    total_amount = round(hours * lot.hourly_rate, 2)

    # 3. Create Reservation
    pass_hash = uuid.uuid4().hex
    reservation = Reservation(
        user_id=current_user.id,
        slot_id=slot.id,
        vehicle_number=res_in.vehicle_number.upper().strip(),
        start_time=res_in.start_time,
        end_time=res_in.end_time,
        total_amount=total_amount,
        payment_status="paid",
        status="booked",
        pass_hash=pass_hash,
    )
    db.add(reservation)
    db.flush()

    # 4. Mark slot as occupied & adjust lot availability
    slot.is_occupied = True
    lot.available_slots = max(0, lot.available_slots - 1)

    # 5. Create Payment record (Mock Gateway Success)
    txn_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
    payment = Payment(
        reservation_id=reservation.id,
        transaction_id=txn_id,
        amount=total_amount,
        payment_method=res_in.payment_method or "Card/UPI",
        status="successful",
    )
    db.add(payment)
    db.flush()

    # 6. Generate QR Pass PDF
    pdf_bytes = qr_pdf_service.generate_parking_pass_pdf(
        reservation_id=reservation.id,
        pass_hash=pass_hash,
        driver_name=current_user.name,
        vehicle_number=reservation.vehicle_number,
        lot_name=lot.lot_name,
        slot_number=slot.slot_number,
        slot_type=slot.slot_type,
        start_time=res_in.start_time,
        end_time=res_in.end_time,
        total_amount=total_amount,
        transaction_id=txn_id,
    )

    # 7. Upload to AWS S3 (with SSE-S3 encryption)
    pdf_filename = f"pass_{pass_hash}.pdf"
    pass_url = s3_service.upload_pass_pdf(pdf_bytes, pdf_filename)
    reservation.pass_qr_url = pass_url

    # 8. Dispatch AWS SES Email Confirmation
    ses_service.send_reservation_ticket(
        recipient_email=current_user.email,
        driver_name=current_user.name,
        vehicle_number=reservation.vehicle_number,
        lot_name=lot.lot_name,
        slot_number=slot.slot_number,
        start_time=res_in.start_time.strftime("%d %b %Y, %I:%M %p"),
        end_time=res_in.end_time.strftime("%d %b %Y, %I:%M %p"),
        total_amount=total_amount,
        pass_url=pass_url,
    )

    # 9. Audit Log
    audit = AuditLog(
        user_id=current_user.id,
        action="RESERVATION_CREATED",
        details=f"Booked slot {slot.slot_number} at {lot.lot_name} for vehicle {reservation.vehicle_number}. Txn: {txn_id}",
    )
    db.add(audit)
    db.commit()
    db.refresh(reservation)

    return reservation


@router.get("", response_model=List[ReservationResponse])
def get_user_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all bookings for the currently authenticated user.
    Admin & attendants can inspect all bookings.
    """
    if current_user.role in ["admin", "attendant"]:
        reservations = db.query(Reservation).order_by(Reservation.created_at.desc()).all()
    else:
        reservations = db.query(Reservation).filter(
            Reservation.user_id == current_user.id
        ).order_by(Reservation.created_at.desc()).all()

    return reservations


@router.get("/{id}", response_model=ReservationResponse)
def get_reservation(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details for a single reservation."""
    res = db.query(Reservation).filter(Reservation.id == id).first()
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    
    if current_user.role not in ["admin", "attendant"] and res.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return res


@router.put("/{id}/cancel", response_model=ReservationResponse)
def cancel_reservation(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel an active reservation and immediately release the allotted slot.
    """
    res = db.query(Reservation).filter(Reservation.id == id).first()
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")

    if current_user.role != "admin" and res.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if res.status in ["completed", "cancelled"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot cancel a reservation in '{res.status}' state.")

    # Update reservation state
    res.status = "cancelled"

    # Free the allotted slot
    slot = db.query(Slot).filter(Slot.id == res.slot_id).first()
    if slot:
        slot.is_occupied = False
        lot = db.query(ParkingLot).filter(ParkingLot.id == slot.lot_id).first()
        if lot:
            lot.available_slots = min(lot.total_slots, lot.available_slots + 1)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="RESERVATION_CANCELLED",
        details=f"Reservation {res.id} cancelled. Released slot {slot.slot_number if slot else 'N/A'}",
    )
    db.add(audit)
    db.commit()
    db.refresh(res)

    return res
