from database import engine, Base
from models import Organization, User, PowerPlant,GenerationData,PlantEvent,MarketPrice,NationalConsumption


#models.py daki tabloları okur, veritabanı yoksa oluşturur.
print("Database tables are being created...")
Base.metadata.create_all(bind=engine)
print("Operation Successful! The tables have been created on Supabase.")