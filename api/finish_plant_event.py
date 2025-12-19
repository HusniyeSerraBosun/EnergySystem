from fastapi import APIRouter, Depends, HTTPException,status
from sqlalchemy.orm import Session
from sqlalchemy import text 
from datetime import datetime
from pydantic import BaseModel

from database import get_db
import models
from .login import get_current_user

router = APIRouter(
    prefix="/plant-events",
    tags=["Power Plant Status"],
)

#---model-----
class EventFinishInput(BaseModel):
    event_id: int





@router.put("/finish",status_code=200,summary="Finish plant events")
def finish_plant_event(
    input_data: EventFinishInput,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. find event
    event = db.query(models.PlantEvent).filter(models.PlantEvent.id == input_data.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Not found")

    # 2. authorization control 
    if current_user.role == "analyst":
        raise HTTPException(status_code=403, detail="No authorization")

    # 3. ownership control 
    plant = db.query(models.PowerPlant).filter(models.PowerPlant.id == event.power_plant_id).first()
    
    if current_user.role != "super_admin" and plant.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Not found")

    # 4. logic control 
    if event.end_time is not None:
        raise HTTPException(status_code=400, detail="This incident has already been concluded.")

    # 5. update
    event.end_time = datetime.now()
    plant.current_status = "Active" #The power plant has been reactivated.

    db.commit()

    # triggering the simulation
    try:
        db.execute(text("SELECT simulate_hourly_energy_data()"))
        db.commit()
    except Exception as e:
        print(f"Warning: An error occurred while triggering the simulation:{e}")

    return {"Message: The incident has been terminated. The switchboard is back in 'Active' mode and the data has been updated."}