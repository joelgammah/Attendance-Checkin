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


def get_current_user(db: Session = Depends(get_db), token: str = Depends(reuse_oauth)):
    # Try Auth0 validation first if configured, fall back to HS256 if that fails
    try:
        if settings.AUTH0_DOMAIN and settings.AUTH0_AUDIENCE:
            # Attempt Auth0 RS256 validation
            try:
                # Validate RS256 token with JWKS
                jwks_url = f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"
                try:
                    jwks = requests.get(jwks_url, timeout=5).json()
                except Exception:
                    print("DEBUG: Failed to fetch JWKS, falling back to HS256")
                    raise ValueError("JWKS fetch failed")

                try:
                    unverified_header = jwt.get_unverified_header(token)
                except Exception as e:
                    print(f"DEBUG: Invalid token header, falling back to HS256: {e}")
                    raise ValueError("Invalid token header")

                kid = unverified_header.get("kid")
                print(f"DEBUG: Looking for kid: {kid}")
                
                # If kid is None, this is likely an HS256 token, fall back immediately
                if kid is None:
                    print("DEBUG: Token has no kid, falling back to HS256")
                    raise ValueError("No kid in token")
                
                rsa_key = None
                for key in jwks.get("keys", []):
                    if key.get("kid") == kid:
                        print(f"DEBUG: Found matching key with kid: {kid}")
                        # build a PEM public key from the JWK
                        jwk_json = json.dumps(key)
                        try:
                            public_key = RSAAlgorithm.from_jwk(jwk_json)
                        except Exception:
                            public_key = None
                        rsa_key = public_key
                        break

                if not rsa_key:
                    print(f"DEBUG: No matching key found for kid: {kid}, falling back to HS256")
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
                    # Try to get actual email first, fallback to sub if needed
                    actual_email = payload.get("email")
                    actual_name = payload.get("name")  # Get name from Auth0 token
                    auth0_sub = payload.get("sub")
                    
                    if actual_email:
                        email = actual_email
                        print(f"DEBUG: Auth0 token validation successful, email: {email}, name: {actual_name}, auth0_sub: {auth0_sub}")
                    else:
                        email = auth0_sub
                        print(f"DEBUG: Auth0 token validation successful, no email claim, using sub: {email}, name: {actual_name}")
                    
                    # NOTE: Access tokens from Auth0 often don't include profile claims like
                    # `email_verified`. Verifying email via the Management API or including
                    # the claim in the access token via an Action is recommended for strict
                    # enforcement. For local/dev convenience, only require that an email
                    # (or subject) be present in the token; do not mandate `email_verified`
                    # here because many access tokens won't contain it.
                except Exception as e:
                    print(f"DEBUG: Auth0 token decode failed, falling back to HS256: {e}")
                    raise ValueError("Auth0 token decode failed")
                    
                if not email:
                    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: missing subject")
                    
            except ValueError:
                # Auth0 validation failed, fall back to HS256
                print("DEBUG: Using fallback HS256 validation")
                try:
                    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                    email: str = payload.get("sub")
                except Exception:
                    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        else:
            # No Auth0 configured, use HS256 only
            print("DEBUG: Using HS256 validation (no Auth0 configured)")
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                email: str = payload.get("sub")
            except Exception:
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
        
        print(f"DEBUG: Creating new user - email: {email}, display_name: {display_name}, auth0_sub: {auth0_sub}")
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
            print(f"DEBUG: Updating existing Auth0 user {user.email} with real email {actual_email}")
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
            print(f"DEBUG: Updated user - new email: {user.email}, new name: {user.name}, auth0_sub: {user.auth0_sub}")
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
                print(f"DEBUG: Updated Auth0 user display name: {user.name}, auth0_sub: {user.auth0_sub}")
        elif 'auth0_sub' in locals() and not user.auth0_sub:
            # For any Auth0 user missing auth0_sub, add it (and update name if available)
            user.auth0_sub = auth0_sub
            if 'actual_name' in locals() and actual_name and not user.name.startswith("User_"):
                user.name = actual_name
            db.commit()
            db.refresh(user)
            print(f"DEBUG: Added auth0_sub to existing user: {user.email}")

    return user


def require_any_role(*roles: UserRole) -> Callable[[User], User]:
    """Dependency that requires the current user to have at least one of the specified roles"""
    def _dep(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.has_any_role(roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return current_user
    return _dep
