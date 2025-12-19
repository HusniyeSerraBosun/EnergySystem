from fastapi import APIRouter, Depends,HTTPException,status
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
import models
from .login import get_current_user

router = APIRouter(
    prefix="/market",
    tags=["Transparency Platform"],
)

@router.post("/ptf",status_code=200,summary="List market clearing price")
def list_mpc(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    
    results = db.query(
        models.MarketPrice.timestamp,
        models.MarketPrice.price_ptf
    ).filter(
        models.MarketPrice.timestamp >= start_date,
        models.MarketPrice.timestamp <= end_date
    ).order_by(models.MarketPrice.timestamp.asc()).all()

    return [{"timestamp": row.timestamp, "price_ptf": row.price_ptf} for row in results]