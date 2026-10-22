import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    slot_id = Column(String(36), ForeignKey("slots.id", ondelete="CASCADE"), nullable=False, index=True)
    
    vehicle_number = Column(String(30), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    total_amount = Column(Float, nullable=False, default=0.0)
    
    payment_status = Column(String(20), default="paid", nullable=False)  # paid, pending
    status = Column(String(20), default="booked", nullable=False)  # booked, checked_in, completed, cancelled
    pass_hash = Column(String(64), unique=True, index=True, nullable=False, default=lambda: uuid.uuid4().hex)
    pass_qr_url = Column(String(500), nullable=True)  # S3 Key or public URL
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="reservations")
    slot = relationship("Slot", back_populates="reservations")
    payment = relationship("Payment", back_populates="reservation", uselist=False, cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    reservation_id = Column(String(36), ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False, unique=True)
    transaction_id = Column(String(64), unique=True, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(30), default="Card/UPI", nullable=False)
    status = Column(String(20), default="successful", nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    reservation = relationship("Reservation", back_populates="payment")
