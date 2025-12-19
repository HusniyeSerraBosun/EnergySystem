from fastapi import APIRouter, Depends,HTTPException,status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from database import get_db
import models
from .login import get_current_user

router = APIRouter(
    prefix="/plant-events",
    tags=["Asset Management"],
)

#----model-----
class EventListInput(BaseModel):
    power_plant_id: Optional[int] = None



@router.post("/",status_code=200,summary="List plant events")
def list_plant_events(
    input_data: EventListInput,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.PlantEvent).join(models.PowerPlant)

    # role control 
    if current_user.role != "super_admin":
        query = query.filter(models.PowerPlant.organization_id == current_user.organization_id)

    # user filter
    if input_data.power_plant_id:
        query = query.filter(models.PlantEvent.power_plant_id == input_data.power_plant_id)

    results = query.order_by(models.PlantEvent.start_time.desc()).all()

    return [{
        "id": row.id,
        "plant_name": row.power_plant.name,
        "event_type": row.event_type,
        "status": "continue" if row.end_time is None else "completed",
        "affected_capacity": row.affected_capacity,
        "start_time": row.start_time,
        "end_time": row.end_time,
        "reason": row.reason,
        "description": row.description
    } for row in results]