from datetime import date, datetime

from sqlalchemy.orm import Session

from app.models import (
    Achievement,
    DailyActivity,
    Lesson,
    LessonAttempt,
    User,
    UserSkillProgress,
)
from app.models.enums import AttemptStatus
from app.repositories.attempts import (
    get_daily_activity,
    get_skill_progress_row,
    has_completed_lesson,
)
from app.services.achievements import award_eligible_achievements
from app.services.stats import record_daily_streak


def _update_skill_progress(
    session: Session,
    learner: User,
    lesson: Lesson,
    completed_at: datetime,
) -> None:
    if has_completed_lesson(
        session,
        user_id=learner.id,
        lesson_id=lesson.id,
    ):
        return

    progress = get_skill_progress_row(
        session,
        user_id=learner.id,
        skill_id=lesson.skill_id,
    )
    if progress is None:
        progress = UserSkillProgress(
            user=learner,
            skill=lesson.skill,
            lessons_completed=0,
            crowns=0,
            is_unlocked=True,
            is_completed=False,
            completed_at=None,
        )
        session.add(progress)

    progress.lessons_completed = min(
        progress.lessons_completed + 1,
        len(lesson.skill.lessons),
    )
    if progress.lessons_completed == len(lesson.skill.lessons):
        progress.is_completed = True
        progress.is_unlocked = True
        progress.crowns += 1
        progress.completed_at = completed_at


def _record_lesson_activity(
    session: Session,
    learner: User,
    lesson: Lesson,
    activity_date: date,
) -> DailyActivity:
    activity = get_daily_activity(
        session,
        user_id=learner.id,
        activity_date=activity_date,
    )
    if activity is None:
        activity = DailyActivity(
            user=learner,
            activity_date=activity_date,
            xp_earned=0,
            lessons_completed=0,
        )
        session.add(activity)

    activity.xp_earned += lesson.xp_reward
    activity.lessons_completed += 1
    learner.total_xp += lesson.xp_reward
    record_daily_streak(learner, activity_date)
    return activity


def complete_attempt(
    session: Session,
    learner: User,
    attempt: LessonAttempt,
    *,
    completed_at: datetime,
    activity_date: date,
) -> list[Achievement]:
    _update_skill_progress(session, learner, attempt.lesson, completed_at)
    activity = _record_lesson_activity(
        session,
        learner,
        attempt.lesson,
        activity_date,
    )
    attempt.status = AttemptStatus.COMPLETED
    attempt.xp_earned = attempt.lesson.xp_reward
    attempt.completed_at = completed_at
    return award_eligible_achievements(
        session,
        learner,
        attempt,
        activity,
        unlocked_at=completed_at,
    )
