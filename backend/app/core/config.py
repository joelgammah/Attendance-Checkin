from pydantic import BaseModel
import os


class Settings(BaseModel):
    PROJECT_NAME: str = "QR Check-In API"
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    CORS_ORIGINS: list[str] = [os.getenv("CORS_ORIGIN", "http://localhost:5173")]
    DEFAULT_CHECKIN_OPEN_MINUTES: int = 15


settings = Settings()
