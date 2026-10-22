from app.routers.auth import router as auth_router
from app.routers.parking_lots import router as parking_lots_router
from app.routers.slots import router as slots_router
from app.routers.reservations import router as reservations_router
from app.routers.verify import router as verify_router
from app.routers.admin import router as admin_router

__all__ = [
    "auth_router",
    "parking_lots_router",
    "slots_router",
    "reservations_router",
    "verify_router",
    "admin_router",
]
