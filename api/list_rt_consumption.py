from fastapi import APIRouter, Depends,HTTPException,status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
import models

from .login import get_current_user

router=APIRouter(
    prefix="/consumption",
    tags=["Transparency Platform"]
)



@router.post("/real-time",status_code=200,summary="List consumption data up to the last two hours.") 
def list_realtime_consumption(
    start_date: datetime, 
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    
    
    time_limit = datetime.now() - timedelta(hours=2)

    # time control 
    if end_date > time_limit:
        end_date = time_limit
    if start_date > time_limit:
        return []


    results= db.query(
        models.NationalConsumption.timestamp, 
        models.NationalConsumption.actual_consumption
    ).filter(
        models.NationalConsumption.timestamp >= start_date,
        models.NationalConsumption.timestamp <= end_date
    ).order_by(models.NationalConsumption.timestamp.asc()).all()

    return [{"timestamp": row.timestamp, "actual_consumption": row.actual_consumption} for row in results]