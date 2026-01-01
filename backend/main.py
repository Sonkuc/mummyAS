from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.db import init_db

from backend.routers.router_children import router as router_children
from backend.routers.router_bf import router as router_bf
from backend.routers.router_sleep import router as router_sleep
from backend.routers.router_milestone import router as router_milestone
from backend.routers.router_wh import router as router_wh
from backend.routers.router_teeth import router as router_teeth
from backend.routers.router_speaking import router as router_speaking
from backend.routers.router_food import router as router_food

app = FastAPI(title="MummyAS API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Initialize database on app startup."""
    init_db()


# Include all routers
app.include_router(router_children)
app.include_router(router_bf)
app.include_router(router_sleep)
app.include_router(router_milestone)
app.include_router(router_wh)
app.include_router(router_teeth)
app.include_router(router_speaking)
app.include_router(router_food)