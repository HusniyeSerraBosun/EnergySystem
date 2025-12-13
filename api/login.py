from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import models
from datetime import datetime, timedelta
from jose import jwt, JWTError
import os
from dotenv import load_dotenv

# load .env file for classified information
load_dotenv()

router = APIRouter(tags=["Authentication"])

#refusing the settings secretly 
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- create token ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- (DEPENDENCY) ---
# this function works each request and determines current user
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="You need to log in (Token is invalid)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
        
    return user

# --- LOGIN ENDPOINT ---
@router.post("/token", summary="Giriş Yap")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # find user
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    # check password (PLAIN TEXT - Hash has been cancelled)
    if not user or user.password_hash != form_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username or password is incorrect.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    #give token (We're also embedding the role and org_id inside because they might be needed on the frontend.)
    access_token = create_access_token(
        data={
            "sub": user.username, 
            "role": user.role, 
            "org_id": user.organization_id
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}