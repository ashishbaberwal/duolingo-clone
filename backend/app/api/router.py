from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.leaderboard import router as leaderboard_router
from app.api.routes.learning import router as learning_router
from app.api.routes.profile import router as profile_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["system"])
api_router.include_router(learning_router, tags=["learning"])
api_router.include_router(profile_router, tags=["learner"])
api_router.include_router(leaderboard_router, tags=["leaderboard"])
