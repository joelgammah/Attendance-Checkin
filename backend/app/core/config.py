from pydantic import BaseModel
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseModel):
    PROJECT_NAME: str = "QR Check-In API"
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    CORS_ORIGINS: list[str] = [os.getenv("CORS_ORIGIN", "http://localhost:5173")]
    DEFAULT_CHECKIN_OPEN_MINUTES: int = 15
    # Optional Auth0 settings. If set, the backend will validate incoming
    # access tokens using the tenant JWKS and require the configured audience.
    AUTH0_DOMAIN: str = os.getenv("AUTH0_DOMAIN", "")  # e.g. dev-xxx.us.auth0.com
    AUTH0_AUDIENCE: str = os.getenv("AUTH0_AUDIENCE", "")  # e.g. https://attendance-api


settings = Settings()
