from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import SessionLocal
from app.repositories.user_repo import UserRepository
import jwt
import requests
import json
from jwt.algorithms import RSAAlgorithm
from typing import Callable
from app.models.user import User, UserRole


reuse_oauth = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _fetch_jwks():
    jwks_url = f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"
    try:
        return requests.get(jwks_url, timeout=5).json()
    except Exception:
        raise ValueError("JWKS fetch failed")


def _get_rsa_key_from_jwks(jwks, token: str):
    try:
        unverified_header = jwt.get_unverified_header(token)
    except Exception:
        raise ValueError("Invalid token header")

    kid = unverified_header.get("kid")
    if kid is None:
        # Likely an HS256 token, indicate fallback
        raise ValueError("No kid in token")

    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            jwk_json = json.dumps(key)
            try:
                return RSAAlgorithm.from_jwk(jwk_json)
            except Exception:
                return None

    raise ValueError("No matching JWK")


def verify_auth0_token(token: str):
    """Validate an Auth0 RS256 token and return a dict with email, name, auth0_sub.
    Raises ValueError on any validation problem so callers can fall back to HS256.
    """
    if not (settings.AUTH0_DOMAIN and settings.AUTH0_AUDIENCE):
        raise ValueError("Auth0 not configured")

    jwks = _fetch_jwks()
    rsa_key = _get_rsa_key_from_jwks(jwks, token)
    if not rsa_key:
        raise ValueError("No matching JWK")

    issuer = f"https://{settings.AUTH0_DOMAIN}/"
    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=settings.AUTH0_AUDIENCE,
            issuer=issuer,
        )
    except Exception:
        raise ValueError("Auth0 token decode failed")

    actual_email = payload.get("email")
    actual_name = payload.get("name")
    auth0_sub = payload.get("sub")

    if actual_email:
        email = actual_email
    else:
        email = auth0_sub

    if not email:
        raise ValueError("Invalid token: missing subject")

    return {"email": email, "actual_email": actual_email, "actual_name": actual_name, "auth0_sub": auth0_sub}


def verify_hs256_token(token: str):
    """Validate an HS256 token (legacy local tokens) and return a dict with email.
    Raises ValueError on failure.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email = payload.get("sub")
        if not email:
            raise ValueError("Invalid HS256 token")
        return {"email": email}
    except Exception:
        raise ValueError("Invalid HS256 token")


def get_current_user(db: Session = Depends(get_db), token: str = Depends(reuse_oauth)):
    # Try Auth0 RS256 validation first (if configured), fall back to HS256
    # Set these to None so later update logic can reference them safely
    actual_email = None
    actual_name = None
    auth0_sub = None
    try:
        if settings.AUTH0_DOMAIN and settings.AUTH0_AUDIENCE:
            try:
                data = verify_auth0_token(token)
                email = data.get("email")
                actual_email = data.get("actual_email")
                actual_name = data.get("actual_name")
                auth0_sub = data.get("auth0_sub")
            except ValueError:
                # Fall back to HS256 if Auth0 validation fails
                try:
                    data = verify_hs256_token(token)
                    email = data.get("email")
                except ValueError:
                    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        else:
            # No Auth0 configured, use HS256 only
            try:
                data = verify_hs256_token(token)
                email = data.get("email")
            except ValueError:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = UserRepository().get_by_email(db, email)
    if not user:
        # Auto-provision a local user for Auth0-authenticated accounts
        # Creates a user with default ATTENDEE role. Password is unused.
        
        # Use Auth0 name if available, otherwise extract from email
        if 'actual_name' in locals() and actual_name:
            display_name = actual_name
        elif "@" in email:
            # Real email address - use the part before @
            display_name = email.split("@")[0]
        else:
            # Auth0 subject ID - extract a friendlier name
            if email.startswith("auth0|"):
                display_name = f"User_{email.split('|')[1][:8]}"  # Use first 8 chars of ID
            else:
                display_name = email[:20]  # Truncate long IDs
        
        user = UserRepository().create(
            db, 
            email=email, 
            name=display_name, 
            password_hash="",
            auth0_sub=auth0_sub if 'auth0_sub' in locals() else None
        )
        user.add_role(UserRole.ATTENDEE)
        db.commit()
        db.refresh(user)
    else:
        # Check if this is an existing Auth0 user that needs updating
        if user.email.startswith("auth0|") and actual_email and "@" in actual_email:
            # Update to use real email and actual name from Auth0
            user.email = actual_email
            if 'actual_name' in locals() and actual_name:
                user.name = actual_name
            else:
                user.name = actual_email.split("@")[0]
            # Store auth0_sub if we have it and it's missing
            if 'auth0_sub' in locals() and not user.auth0_sub:
                user.auth0_sub = auth0_sub
            db.commit()
            db.refresh(user)
        elif user.email.startswith("auth0|") and user.name.startswith("auth0|"):
            # Improve the display name even if we don't have real email
            if user.email.startswith("auth0|"):
                # Use Auth0 name if available, otherwise fallback to user ID
                if 'actual_name' in locals() and actual_name:
                    user.name = actual_name
                else:
                    user.name = f"User_{user.email.split('|')[1][:8]}"
                # Store auth0_sub if we have it and it's missing
                if 'auth0_sub' in locals() and not user.auth0_sub:
                    user.auth0_sub = auth0_sub
                db.commit()
                db.refresh(user)
        elif 'auth0_sub' in locals() and not user.auth0_sub:
            # For any Auth0 user missing auth0_sub, add it (and update name if available)
            user.auth0_sub = auth0_sub
            if 'actual_name' in locals() and actual_name and not user.name.startswith("User_"):
                user.name = actual_name
            db.commit()
            db.refresh(user)

    return user


def require_any_role(*roles: UserRole) -> Callable[[User], User]:
    """Dependency that requires the current user to have at least one of the specified roles"""
    def _dep(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.has_any_role(roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return current_user
    return _dep
