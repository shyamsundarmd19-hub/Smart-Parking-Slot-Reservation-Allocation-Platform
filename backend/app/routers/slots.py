from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import require_role
from app.models.parking import ParkingLot, Slot
from app.models.user import User
from app.schemas.parking import SlotResponse, LotGridResponse, SlotCreate, ParkingLotResponse

router = APIRouter(prefix="/slots", tags=["Parking Slots"])


@router.get("/lot/{lot_id}", response_model=LotGridResponse)
def get_slot_grid(lot_id: str, db: Session = Depends(get_db)):
    """
    Retrieve interactive visual slot grid for a specific parking facility.
    Shows all slots, their types (car, bike, EV), and live occupancy status.
    """
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking lot not found")

    slots = db.query(Slot).filter(Slot.lot_id == lot_id).order_by(Slot.slot_number.asc()).all()

    # Dynamic count
    available_count = sum(1 for s in slots if not s.is_occupied)
    lot.available_slots = available_count

    return LotGridResponse(
        lot=ParkingLotResponse.model_validate(lot),
        slots=[SlotResponse.model_validate(s) for s in slots],
    )


@router.post("", response_model=SlotResponse, status_code=status.HTTP_201_CREATED)
def add_slot(
    slot_in: SlotCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"])),
):
    """Admin endpoint: Add a single slot to an existing lot."""
    lot = db.query(ParkingLot).filter(ParkingLot.id == slot_in.lot_id).first()
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking lot not found")

    # Check for duplicate slot number in same lot
    existing = db.query(Slot).filter(Slot.lot_id == slot_in.lot_id, Slot.slot_number == slot_in.slot_number).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slot number already exists in this lot")

    new_slot = Slot(
        lot_id=slot_in.lot_id,
        slot_number=slot_in.slot_number,
        slot_type=slot_in.slot_type,
        is_occupied=slot_in.is_occupied,
    )
    db.add(new_slot)
    lot.total_slots += 1
    if not new_slot.is_occupied:
        lot.available_slots += 1

    db.commit()
    db.refresh(new_slot)
    return new_slot
