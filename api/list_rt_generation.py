from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime,timedelta
from typing import Optional

from database import get_db
import models
from .login import get_current_user

router = APIRouter(
    prefix="/generation",
    tags=["Generation Management"],
)



@router.post("/",status_code=200,summary="List real-time generation data")
def list_realtime_generation(
    start_date: datetime,
    end_date: datetime,
    power_plant_id: Optional[int] = None,
    organization_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    time_limit = today_start - timedelta(seconds=1)

    # time control 
    if end_date > time_limit:
        end_date = time_limit
    if start_date > time_limit:
        return []
    
    # --- 1. security-----
    
    # for a specific power plant, plant control
    if power_plant_id:
        target_plant = db.query(models.PowerPlant).filter(models.PowerPlant.id == power_plant_id).first()
        
        # no power plant
        if not target_plant:
            raise HTTPException(status_code=404, detail="Not found")

        # Unless it's a Super Admin AND the power plant doesn't belong to the user's company.
        if current_user.role != "super_admin" and target_plant.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_404_FORBIDDEN,
                detail="Not found"
            )
            
    # Unless it's a Super Admin AND it is making a request with a different org_id
    if current_user.role != "super_admin" and organization_id:
        if organization_id != current_user.organization_id:
             raise HTTPException(
                status_code=status.HTTP_404_FORBIDDEN,
                detail="not found"
            )


    # --- 2. query
    query = db.query(
        models.GenerationData.timestamp,
        models.GenerationData.actual_generation,
        models.GenerationData.planned_generation,
        models.GenerationData.settlement_generation,
        models.PowerPlant.name.label("plant_name"),
        models.PowerPlant.eic,
        models.PowerPlant.fuel_type,
        models.PowerPlant.organization_id
    ).join(models.PowerPlant, models.GenerationData.power_plant_id == models.PowerPlant.id)

    query = query.filter(
        models.GenerationData.timestamp >= start_date,
        models.GenerationData.timestamp <= end_date
    )

    # --- 3.filter
    if current_user.role == "super_admin":
        if organization_id:
            query = query.filter(models.PowerPlant.organization_id == organization_id)
        if power_plant_id:
            query = query.filter(models.GenerationData.power_plant_id == power_plant_id)
    else:
        # user within their own company
        query = query.filter(models.PowerPlant.organization_id == current_user.organization_id)
        # sql control
        if power_plant_id:
            query = query.filter(models.GenerationData.power_plant_id == power_plant_id)

    results = query.order_by(models.GenerationData.timestamp.asc()).all()

    return [{
        "timestamp": row.timestamp,
        "plant_name": row.plant_name,
        "eic": row.eic,
        "fuel_type": row.fuel_type,
        "actual_generation": row.actual_generation,
        "planned_generation": row.planned_generation,
        "settlement_generation":row.settlement_generation
    } for row in results]