from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import require_role
from app.models.parking import ParkingLot, Slot
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.parking import ParkingLotCreate, ParkingLotResponse

router = APIRouter(prefix="/parking-lots", tags=["Parking Lots"])


@router.get("", response_model=List[ParkingLotResponse])
def list_parking_lots(db: Session = Depends(get_db)):
    """
    List all active parking lots with dynamic, real-time available slot counts.
    """
    lots = db.query(ParkingLot).filter(ParkingLot.is_active == True).all()

    # Recalculate and synchronize real-time available slot count
    for lot in lots:
        available = db.query(Slot).filter(
            Slot.lot_id == lot.id,
            Slot.is_occupied == False,
        ).count()
        lot.available_slots = available

    return lots


@router.get("/{lot_id}", response_model=ParkingLotResponse)
def get_parking_lot(lot_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a single parking lot."""
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking lot not found")
    
    lot.available_slots = db.query(Slot).filter(
        Slot.lot_id == lot.id,
        Slot.is_occupied == False,
    ).count()
    return lot


@router.post("", response_model=ParkingLotResponse, status_code=status.HTTP_201_CREATED)
def create_parking_lot(
    lot_in: ParkingLotCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"])),
):
    """
    Admin endpoint: Create a new parking facility and automatically generate initial slots.
    """
    new_lot = ParkingLot(
        lot_name=lot_in.lot_name,
        location=lot_in.location,
        total_slots=lot_in.total_slots,
        available_slots=lot_in.total_slots,
        hourly_rate=lot_in.hourly_rate,
        is_active=lot_in.is_active,
    )
    db.add(new_lot)
    db.flush()

    # Automatically initialize slots with standard alphanumeric designations (e.g., A-101)
    slots_to_add = []
    for i in range(1, lot_in.total_slots + 1):
        section = chr(65 + ((i - 1) // 20))  # A, B, C...
        number = 100 + ((i - 1) % 20) + 1
        slot_type = "EV" if i % 10 == 0 else ("bike" if i % 5 == 0 else "car")
        slot = Slot(
            lot_id=new_lot.id,
            slot_number=f"{section}-{number}",
            slot_type=slot_type,
            is_occupied=False,
        )
        slots_to_add.append(slot)

    db.add_all(slots_to_add)

    # Audit log
    audit = AuditLog(
        user_id=admin_user.id,
        action="LOT_CREATED",
        details=f"Admin created lot '{new_lot.lot_name}' with {lot_in.total_slots} slots",
    )
    db.add(audit)
    db.commit()
    db.refresh(new_lot)
    return new_lot
