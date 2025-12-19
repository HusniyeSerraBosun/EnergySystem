from fastapi import APIRouter,Depends,HTTPException,status
from sqlalchemy.orm import Session
from database import get_db
import models

from .login import get_current_user

router=APIRouter(
    prefix="/plants",
    tags=["Asset Management"]    
)

@router.post("/",status_code=201,summary="Create New Plant")
def create_plant(
    name:str,
    eic:str,
    installed_capacity:float,
    fuel_type:str,
    organization_name:str,
    is_yekdem:bool=False,
    is_res: bool=False,
    db:Session=Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="no transaction authorization"
        )
    
    #control organization id
    org=db.query(models.Organization).filter(models.Organization.name==organization_name).first()
    if not org:
        raise HTTPException(status_code=404, detail="No such Organization found! Please make sure you spell it correctly ")

    #control eic 
    existing_plant=db.query(models.PowerPlant).filter(models.PowerPlant.eic==eic).first()
    if existing_plant:
        raise HTTPException(status_code=400, detail="A power plant with this EIC code already exists!") 

    
    #create power plant
    new_plant=models.PowerPlant(
        name=name,
        eic=eic,
        installed_capacity=installed_capacity,
        fuel_type=fuel_type,
        organization_id=org.id,
        is_yekdem=is_yekdem,
        is_res=is_res
    )

    db.add(new_plant)
    db.commit()
    db.refresh(new_plant)
    return new_plant

