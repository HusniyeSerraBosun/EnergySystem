from fastapi import APIRouter, Depends, HTTPException,status
from sqlalchemy.orm import Session
from database import get_db
import models

from .login import get_current_user

router=APIRouter(
    prefix="/users",
    tags=["Asset Management"],
    #dependencies=[Depends(get_current_user)]
)

@router.post("/",summary="Create new user")
def create_user(
    username:str,
    password:str,
    first_name:str,
    last_name:str,
    email:str,
    role:str,
    organization_id:int,
    db:Session=Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="no transaction authorization"
        )
    

    org=db.query(models.Organization).filter(models.Organization.id==organization_id).first()
    if not org:
        raise HTTPException(
            status_code=404,
            detail=f"{organization_id} is not found!"
        )
    
    existing_user=db.query(models.User).filter(models.User.username==username).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="This user is already exist!"
        )
    
    new_user=models.User(
        username=username,
        password_hash=password,
        first_name=first_name,
        last_name=last_name,
        email=email,
        role=role,
        organization_id=org.id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

