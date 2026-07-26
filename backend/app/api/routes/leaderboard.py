from fastapi import APIRouter

from app.api.dependencies import LearnerDependency, SessionDependency
from app.schemas.leaderboard import LeaderboardResponse
from app.services.leaderboard import get_leaderboard

router = APIRouter()


@router.get("/leaderboard", response_model=LeaderboardResponse)
def leaderboard(
    session: SessionDependency,
    learner: LearnerDependency,
) -> LeaderboardResponse:
    return get_leaderboard(session, learner)
