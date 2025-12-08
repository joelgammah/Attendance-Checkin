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
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/terriercheckin",
    )
    CORS_ORIGINS: list[str] = [os.getenv("CORS_ORIGIN", "http://localhost:5173")]
    DEFAULT_CHECKIN_OPEN_MINUTES: int = 15
    # Optional Auth0 settings. If set, the backend will validate incoming
    # access tokens using the tenant JWKS and require the configured audience.
    AUTH0_DOMAIN: str = os.getenv("AUTH0_DOMAIN", "")  # e.g. dev-xxx.us.auth0.com
    AUTH0_AUDIENCE: str = os.getenv("AUTH0_AUDIENCE", "")  # e.g. https://attendance-api
    # Testing flag: explicit TESTING env wins; otherwise infer from pytest
    TESTING: bool = (
        os.getenv("TESTING").lower() in ("1", "true", "yes")
        if os.getenv("TESTING") is not None
        else os.getenv("PYTEST_CURRENT_TEST") is not None
    )
    # Optional server-side enforcement for comment requirement (off by default)
    ENFORCE_COMMENT: bool = os.getenv("ENFORCE_COMMENT", "").lower() in ("1", "true", "yes")

def is_testing_runtime() -> bool:
    """Evaluate testing mode dynamically from environment.
    Explicit TESTING env wins, otherwise detect pytest via PYTEST_CURRENT_TEST.
    """
    val = os.getenv("TESTING")
    if val is not None:
        v = val.lower()
        if v in ("1", "true", "yes"):
            return True
        if v in ("0", "false", "no"):
            return False
    return os.getenv("PYTEST_CURRENT_TEST") is not None

def enforce_comment_runtime() -> bool:
    """Evaluate comment enforcement dynamically from environment."""
    val = os.getenv("ENFORCE_COMMENT")
    return val is not None and val.lower() in ("1", "true", "yes")


settings = Settings()

# Normalize Render-style URLs globally in settings object so all DB consumers work
if settings.DATABASE_URL.startswith("postgres://"):
    settings.DATABASE_URL = "postgresql+psycopg://" + settings.DATABASE_URL[len("postgres://"):]
