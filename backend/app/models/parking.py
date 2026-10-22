import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class ParkingLot(Base):
    __tablename__ = "parking_lots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    lot_name = Column(String(150), nullable=False, index=True)
    location = Column(String(255), nullable=False)
    total_slots = Column(Integer, default=0, nullable=False)
    available_slots = Column(Integer, default=0, nullable=False)
    hourly_rate = Column(Float, default=20.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    slots = relationship("Slot", back_populates="lot", cascade="all, delete-orphan")


class Slot(Base):
    __tablename__ = "slots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    lot_id = Column(String(36), ForeignKey("parking_lots.id", ondelete="CASCADE"), nullable=False, index=True)
    slot_number = Column(String(20), nullable=False, index=True)  # e.g., 'A-101', 'B-202'
    slot_type = Column(String(20), default="car", nullable=False)  # 'car', 'bike', 'EV'
    is_occupied = Column(Boolean, default=False, nullable=False)

    # Relationships
    lot = relationship("ParkingLot", back_populates="slots")
    reservations = relationship("Reservation", back_populates="slot", cascade="all, delete-orphan")
