from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

#database şifresini aldım.
load_dotenv()
SQLALCHEMY_DATABASE_URL=os.getenv("DATABASE_URL")

#engine çalıştırıyorum. Veritabanına ulaşabilmek için
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"sslmode": "require"}
)


#database işlemlerini gerçekleştirebilmek için session alıyorum.
SessionLocal=sessionmaker(autocommit=False, autoflush=False, bind=engine)

#base sınıfı üretiyorum.
Base=declarative_base()


#dependency injection için 
def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()