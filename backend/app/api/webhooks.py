from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import logging

from app.api.deps import get_db
from app.repositories.user_repo import UserRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

class Auth0UserDeletedPayload(BaseModel):
    auth0_sub: str

@router.post("/auth0-user-deleted")
async def auth0_user_deleted(
    payload: Auth0UserDeletedPayload,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Webhook endpoint to handle user deletion from Auth0.
    Called by Auth0 Action when a user is deleted from Auth0 Dashboard.
    """
    try:
        auth0_sub = payload.auth0_sub
        logger.info(f"Received Auth0 user deletion webhook for: {auth0_sub}")
        
        user_repo = UserRepository()
        
        # Find user by auth0_sub first
        user = user_repo.get_by_auth0_sub(db, auth0_sub)
        
        # If not found by auth0_sub, try by email (for legacy users where email = auth0_sub)
        if not user:
            user = user_repo.get_by_email(db, auth0_sub)
        
        if not user:
            logger.warning(f"User not found in local DB for Auth0 ID: {auth0_sub}")
            return {"status": "user_not_found", "message": "User not found in local database"}
        
        # Delete the user from local database
        user_repo.delete(db, user.id)
        db.commit()
        
        logger.info(f"Successfully deleted user {user.email} (ID: {user.id}) from local database")
        
        return {
            "status": "success", 
            "message": f"User {user.email} deleted from local database",
            "deleted_user_id": user.id
        }
        
    except Exception as e:
        logger.error(f"Error processing Auth0 user deletion webhook: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process user deletion: {str(e)}")