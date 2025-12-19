from fastapi import APIRouter, Depends,HTTPException,status
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
import models
from .login import get_current_user

router = APIRouter(
    prefix="/consumption",
    tags=["Transparency Platform"],
)

@router.post("/forecast",status_code=200,summary="List demand-forecast data")
def list_demand_forecast(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    
    results = db.query(
        models.NationalConsumption.timestamp,
        models.NationalConsumption.demand_forecast
    ).filter(
        models.NationalConsumption.timestamp >= start_date,
        models.NationalConsumption.timestamp <= end_date
    ).order_by(models.NationalConsumption.timestamp.asc()).all()

    return [{"timestamp": row.timestamp, "demand_forecast": row.demand_forecast} for row in results]