from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "ParkCloud API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "change-me-in-production-parkcloud-super-secret-key-32chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    ALGORITHM: str = "HS256"
    
    # Database (Default Postgres or AWS RDS Postgres)
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/parkcloud"
    
    # AWS Settings (Optimized for Free Tier)
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET_NAME: str = "parkcloud-passes"
    AWS_SES_SENDER_EMAIL: str = "noreply@parkcloud.app"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1",
        "http://localhost",
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
