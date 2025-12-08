from fastapi import FastAPI
from database import engine
import models
from api import all_routers

models.Base.metadata.create_all(bind=engine)

app=FastAPI()

for router in all_routers:
    app.include_router(router)

@app.get("/")
def read_root():
    return {"Status: Energy Trading System API is Live!"}