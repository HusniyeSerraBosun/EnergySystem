from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session
from database import get_db
import models

from typing import Optional

from .login import get_current_user

router=APIRouter(
    prefix="/plants",
    tags=["Asset Management"]
)

@router.get("/",status_code=200,summary="List all plants")
def list_plants(
    organization_id: Optional[int] = None, # this is for super_admin, if super_admin wants to list plants by org, then it will works
    db:Session=Depends(get_db),
    current_user: models.User = Depends(get_current_user)
    ):


    # ---SUPER ADMIN---
    if current_user.role == "super_admin":

        #listing for org id
        if organization_id:
            return db.query(models.PowerPlant).filter(models.PowerPlant.organization_id == organization_id).all()
        #no org id then list all of them 
        return db.query(models.PowerPlant).all()

    # ---Admin / Analyst ---
    else:
        #The organization ID can be entered, but only the switchboards belonging to that organization are listed.
        return db.query(models.PowerPlant).filter(
            models.PowerPlant.organization_id == current_user.organization_id
        ).all()
