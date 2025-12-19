from fastapi import APIRouter, Depends,HTTPException,status
from sqlalchemy.orm import Session
from datetime import datetime,timedelta

from database import get_db
import models
from .login import get_current_user

router = APIRouter(
    prefix="/market",
    tags=["Transparency Platform"],
)



@router.post("/smp",status_code=200,summary="List system marginal price")
def list_smp(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    time_limit = datetime.now() - timedelta(hours=4)

    if end_date > time_limit:
        end_date = time_limit

    if start_date > time_limit:
        return []
    
    results = db.query(
        models.MarketPrice.timestamp,
        models.MarketPrice.price_smf
    ).filter(
        models.MarketPrice.timestamp >= start_date,
        models.MarketPrice.timestamp <= end_date
    ).order_by(models.MarketPrice.timestamp.asc()).all()

    return [{"timestamp": row.timestamp, "price_smf": row.price_smf} for row in results]