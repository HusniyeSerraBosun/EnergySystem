from fastapi import APIRouter,Depends,HTTPException,status
from sqlalchemy.orm import Session
from database import get_db
import models

from .login import get_current_user

router=APIRouter(
    prefix="/users",
    tags=["Asset Management"]
)

@router.get("/",status_code=200,summary="List all users")
def list_users(db:Session=Depends(get_db),current_user: models.User = Depends(get_current_user)):

    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="no transaction authorization"
        )

    return db.query(models.User).all()