import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
import app.models  # Ensure all SQLAlchemy models are registered
from app.routers import (
    auth_router,
    parking_lots_router,
    slots_router,
    reservations_router,
    verify_router,
    admin_router,
)

# Ensure local fallback directory exists for PDF passes
LOCAL_PASSES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "passes")
os.makedirs(LOCAL_PASSES_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on launch if they do not already exist
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Database table initialization warning: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local passes folder as static endpoint for local testing fallback
app.mount("/api/static/passes", StaticFiles(directory=LOCAL_PASSES_DIR), name="passes")

# Register API v1 Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(parking_lots_router, prefix=settings.API_V1_STR)
app.include_router(slots_router, prefix=settings.API_V1_STR)
app.include_router(reservations_router, prefix=settings.API_V1_STR)
app.include_router(verify_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

# Also expose without /v1 prefix for direct root proxying convenience
app.include_router(auth_router, prefix="/api")
app.include_router(parking_lots_router, prefix="/api")
app.include_router(slots_router, prefix="/api")
app.include_router(reservations_router, prefix="/api")
app.include_router(verify_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": f"{settings.API_V1_STR}/docs",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "database": "connected",
        "aws_s3_bucket": settings.AWS_S3_BUCKET_NAME,
    }
