from sqlmodel import SQLModel, Session, create_engine

sqlite_url = "sqlite:///./app.db"
engine = create_engine(sqlite_url, echo=True)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session