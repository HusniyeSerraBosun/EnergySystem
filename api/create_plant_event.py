from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text 
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from enum import Enum

from database import get_db
import models 
from .login import get_current_user

router = APIRouter(
    prefix="/plant-events",
    tags=["Power Plant Status"],
)

#------models-----------
class EventType(str, Enum):
    MAINTENANCE = "Maintenance"
    FAILURE = "Failure"

class EventCreateInput(BaseModel):
    power_plant_id: int
    event_type: EventType
    reason: str
    description: Optional[str] = None
    affected_capacity: float




@router.post("/create", status_code=status.HTTP_201_CREATED,summary="Create plant events")
def create_plant_event(
    event_data: EventCreateInput,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. authorization control
    if current_user.role == "analyst":
        raise HTTPException(status_code=403, detail="No authorization")

    # 2. power plant control 
    plant = db.query(models.PowerPlant).filter(models.PowerPlant.id == event_data.power_plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Not found")

    # 3. ownership control
    if current_user.role != "super_admin" and plant.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Not found")

    # 4. business logic control 
    active_event = db.query(models.PlantEvent).filter(
        models.PlantEvent.power_plant_id == event_data.power_plant_id,
        models.PlantEvent.end_time == None
    ).first()

    if active_event:
        raise HTTPException(status_code=400, detail="The event is ongoing. First, put an end to it.")

    if event_data.affected_capacity > plant.installed_capacity:
        raise HTTPException(status_code=400, detail=f"Error: Affected capacity ({event_data.affected_capacity}) cannot exceed the plant's installed capacity ({plant.installed_capacity}).!")

    # 5.registration, status update
    new_event = models.PlantEvent(
        power_plant_id=event_data.power_plant_id,
        event_type=event_data.event_type.value,
        reason=event_data.reason,
        description=event_data.description,
        affected_capacity=event_data.affected_capacity,
        start_time=datetime.now(),
        end_time=None
    )
    
    plant.current_status = event_data.event_type.value 

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    # triggering the simulation
    try:
        db.execute(text("SELECT simulate_hourly_energy_data()"))
        db.commit()
    except Exception as e:
        print(f"Warning: An error occurred while triggering the simulation:{e}")

    return {"Message": "Event initiated. Production data updated in real time.", "event_id": new_event.id}