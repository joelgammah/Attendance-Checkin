import json
import jwt
from typing import Dict, Optional
import requests
from fastapi import HTTPException, status
from functools import lru_cache
import time

class Auth0TokenVerifier:
    def __init__(self, domain: str, audience: Optional[str] = None):
        self.domain = domain
        self.audience = audience
        self.algorithms = ["RS256"]
        self.jwks_uri = f"https://{domain}/.well-known/jwks.json"
        self._jwks_cache = None
        self._cache_time = 0
        self._cache_ttl = 3600  # Cache JWKS for 1 hour

    def _get_jwks(self) -> Dict:
        """Get JSON Web Key Set from Auth0"""
        current_time = time.time()
        
        # Return cached JWKS if still valid
        if self._jwks_cache and (current_time - self._cache_time) < self._cache_ttl:
            return self._jwks_cache
        
        try:
            response = requests.get(self.jwks_uri, timeout=10)
            response.raise_for_status()
            self._jwks_cache = response.json()
            self._cache_time = current_time
            return self._jwks_cache
        except requests.RequestException as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Unable to fetch Auth0 JWKS: {str(e)}"
            )

    def _get_rsa_key(self, token: str) -> Dict:
        """Extract RSA key from JWKS for token verification"""
        try:
            unverified_header = jwt.get_unverified_header(token)
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token header"
            )

        jwks = self._get_jwks()
        
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                return {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to find appropriate key"
        )

    def verify_token(self, token: str) -> Dict:
        """Verify Auth0 JWT token and return payload"""
        try:
            rsa_key = self._get_rsa_key(token)
            
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=self.algorithms,
                audience=self.audience,
                issuer=f"https://{self.domain}/"
            )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTClaimsError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token claims"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

@lru_cache()
def get_auth0_verifier() -> Auth0TokenVerifier:
    """Get Auth0 token verifier instance"""
    from app.core.config import settings
    return Auth0TokenVerifier(
        domain=settings.AUTH0_DOMAIN,
        audience=getattr(settings, 'AUTH0_AUDIENCE', None)
    )