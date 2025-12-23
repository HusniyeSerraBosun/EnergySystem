from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from api import all_routers

models.Base.metadata.create_all(bind=engine)

app=FastAPI()

#settings for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in all_routers:
    app.include_router(router)

@app.get("/")
def read_root():
    return {"Status: Energy Trading System API is Live!"}