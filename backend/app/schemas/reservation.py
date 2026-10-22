from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReservationCreate(BaseModel):
    slot_id: str
    vehicle_number: str
    start_time: datetime
    end_time: datetime
    payment_method: Optional[str] = "Card/UPI"


class PaymentResponse(BaseModel):
    id: str
    transaction_id: str
    amount: float
    payment_method: str
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True


class ReservationResponse(BaseModel):
    id: str
    user_id: str
    slot_id: str
    vehicle_number: str
    start_time: datetime
    end_time: datetime
    total_amount: float
    payment_status: str
    status: str
    pass_hash: str
    pass_qr_url: Optional[str] = None
    created_at: datetime
    payment: Optional[PaymentResponse] = None

    class Config:
        from_attributes = True


class ScanPassResponse(BaseModel):
    valid: bool
    message: str
    action_taken: str  # CHECK_IN, CHECK_OUT, INVALID, ALREADY_COMPLETED
    reservation: Optional[ReservationResponse] = None
    slot_number: Optional[str] = None
    lot_name: Optional[str] = None
    driver_name: Optional[str] = None
