from fastapi import APIRouter,Depends,HTTPException,status
from sqlalchemy.orm import Session
from database import get_db
import models

from .login import get_current_user

#router settings
#this router is just to add organization 
router=APIRouter(
    prefix="/organizations",
    tags=["Asset Management"],
    #dependencies=[Depends(get_current_user)]
)

@router.post("/",status_code=201,summary="Create New Organization")
def create_organization(name:str, eic:str, db:Session=Depends(get_db),current_user: models.User = Depends(get_current_user)):
    
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="no transaction authorization"
        )
    
    existing_org=db.query(models.Organization).filter(models.Organization.eic==eic).first()
    if existing_org:
        raise HTTPException(status_code=400, detail="An organization with this EIC code already exists!")
    
    new_org=models.Organization(name=name,eic=eic)
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    return new_org