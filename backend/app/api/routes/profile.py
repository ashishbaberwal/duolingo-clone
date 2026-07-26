from fastapi import APIRouter

from app.api.dependencies import LearnerDependency, SessionDependency
from app.schemas.profile import ProfileResponse
from app.services.profile import get_profile

router = APIRouter()


@router.get("/profile", response_model=ProfileResponse)
def profile(
    session: SessionDependency,
    learner: LearnerDependency,
) -> ProfileResponse:
    return get_profile(session, learner)
