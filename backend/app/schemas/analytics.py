from pydantic import BaseModel
from typing import List, Dict, Any


class OccupancyMetric(BaseModel):
    lot_id: str
    lot_name: str
    total_slots: int
    occupied_slots: int
    occupancy_rate: float


class PeakHourStat(BaseModel):
    hour: int
    booking_count: int


class AnalyticsResponse(BaseModel):
    total_revenue: float
    total_bookings: int
    active_reservations: int
    overall_occupancy_rate: float
    lot_metrics: List[OccupancyMetric]
    peak_hours: List[PeakHourStat]
    recent_transactions: List[Dict[str, Any]]
