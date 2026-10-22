from pydantic import BaseModel
from typing import List, Optional


class SlotBase(BaseModel):
    slot_number: str
    slot_type: str = "car"  # car, bike, EV
    is_occupied: bool = False


class SlotCreate(SlotBase):
    lot_id: str


class SlotResponse(SlotBase):
    id: str
    lot_id: str

    class Config:
        from_attributes = True


class ParkingLotBase(BaseModel):
    lot_name: str
    location: str
    total_slots: int
    hourly_rate: float = 20.0
    is_active: bool = True


class ParkingLotCreate(ParkingLotBase):
    pass


class ParkingLotResponse(ParkingLotBase):
    id: str
    available_slots: int

    class Config:
        from_attributes = True


class LotGridResponse(BaseModel):
    lot: ParkingLotResponse
    slots: List[SlotResponse]
