import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, Session, create_engine

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL, echo=False)

def init_db():
    # Vytvoří tabulky, pokud neexistují
    SQLModel.metadata.create_all(engine)

def reset_db():
    # Smaže vše a vytvoří znovu - POZOR, smaže všechna data!
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session