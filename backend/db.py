from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy import event
from sqlalchemy.engine import Engine

# 1. Definice cesty k databázi
sqlite_url = "postgresql+psycopg2://postgres.nayivuagrbjklmtinfjv:0th3QHP42r80vo3q@aws-0-eu-west-1.pooler.supabase.com:6543/postgres" # "sqlite:///./app.db" 

# 2. Vytvoření engine
engine = create_engine(sqlite_url, echo=False) # True pro výpisy v terminálu

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