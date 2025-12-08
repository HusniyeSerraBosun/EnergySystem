from sqlalchemy import Column, Integer,String,Float,Boolean,ForeignKey,DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

#Çok fazla tablo içeren bir proje olmadığı için models folder ı altında
#modeller tek tek python dosyası olarak oluşturulmamıştır. 

#1. ORGANIZATION
class Organization(Base):
    __tablename__="organizations"

    id=Column(Integer,primary_key=True, index=True)
    name=Column(String,unique=True,index=True)
    eic=Column(String,unique=True,index=True)
    created_at=Column(DateTime,default=datetime.datetime.utcnow)

    #relationships
    users=relationship("User",back_populates="organization")
    power_plants=relationship("PowerPlant",back_populates="organization")


#2 USER
class User(Base):
    __tablename__="users"

    id=Column(Integer,primary_key=True, index=True)
    username=Column(String,unique=True, index=True)
    password_hash=Column(String)
    first_name=Column(String)
    last_name=Column(String)
    email=Column(String)
    role=Column(String)

    organization_id=Column(Integer,ForeignKey("organizations.id"))
    organization=relationship("Organization",back_populates="users")

#3. POWER PLANT 
class PowerPlant(Base):
    __tablename__="power_plants"

    id=Column(Integer, primary_key=True,index=True)
    name=Column(String,index=True)
    eic=Column(String,unique=True)
    installed_capacity=Column(Float)
    fuel_type=Column(String)
    is_yekdem=Column(Boolean,default=False)
    is_res=Column(Boolean,default=False)

    current_status=Column(String,default="Active")

    organization_id=Column(Integer,ForeignKey("organizations.id"))
    organization=relationship("Organization", back_populates="power_plants")

    generation_data=relationship("GenerationData", back_populates="power_plant")
    plant_events=relationship("PlantEvent",back_populates="power_plant")


#4. GENERATION DATA
class GenerationData(Base):
    __tablename__="generation_data"

    id=Column(Integer,primary_key=True,index=True)
    timestamp=Column(DateTime)
    actual_generation=Column(Float)
    planned_generation=Column(Float)
    settlement_generation=Column(Float)

    power_plant_id=Column(Integer,ForeignKey("power_plants.id"))
    power_plant=relationship("PowerPlant", back_populates="generation_data")

#5. PLANT EVENT
class PlantEvent(Base):
    __tablename__="plant_events"

    id=Column(Integer,primary_key=True,index=True)
    event_type=Column(String)
    reason=Column(String)
    start_time=Column(DateTime)
    end_time=Column(DateTime,nullable=True)
    affected_capacity=Column(Float)
    description=Column(String)

    power_plant_id=Column(Integer,ForeignKey("power_plants.id"))

    power_plant=relationship("PowerPlant",back_populates="plant_events")

#6. MARKET PRICE
class MarketPrice(Base):
    __tablename__="market_prices"

    id=Column(Integer,primary_key=True,index=True)
    timestamp=Column(DateTime,unique=True)
    price_ptf=Column(Float)
    price_smf=Column(Float)

#7. NATIONAL CONSUMPTION 
class NationalConsumption(Base):
    __tablename__="national_consumption"

    id=Column(Integer,primary_key=True,index=True)
    timestamp=Column(DateTime,unique=True)
    actual_consumption=Column(Float)
    demand_forecast=Column(Float)
