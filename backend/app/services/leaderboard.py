from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User
from app.schemas.leaderboard import LeaderboardEntry, LeaderboardResponse


def get_leaderboard(session: Session, learner: User) -> LeaderboardResponse:
    users = list(
        session.scalars(select(User).order_by(User.total_xp.desc(), User.username))
    )
    entries = [
        LeaderboardEntry(
            rank=rank,
            username=user.username,
            display_name=user.display_name,
            avatar_key=user.avatar_key,
            total_xp=user.total_xp,
            is_current_learner=user.id == learner.id,
        )
        for rank, user in enumerate(users, start=1)
    ]
    current_rank = next(
        entry.rank for entry in entries if entry.is_current_learner
    )
    return LeaderboardResponse(
        entries=entries,
        current_learner_rank=current_rank,
    )
