from dataclasses import dataclass
from datetime import UTC, date, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    Achievement,
    AttemptAnswer,
    Course,
    DailyActivity,
    Exercise,
    ExerciseOption,
    Lesson,
    LessonAttempt,
    Skill,
    Unit,
    User,
    UserAchievement,
    UserSkillProgress,
)
from app.models.enums import AttemptStatus
from app.seed.catalog import ACHIEVEMENT_SEEDS, COURSE_UNITS, LEARNER_SEEDS
from app.services.auth import hash_password, password_matches

COURSE_CODE = "es-en"
DEFAULT_DEMO_USERNAME = "learner"
DEFAULT_DEMO_PASSWORD = "LingoTrail@123"


@dataclass(frozen=True, slots=True)
class SeedResult:
    created: bool
    courses: int
    units: int
    skills: int
    lessons: int
    exercises: int
    users: int


def _database_counts(session: Session, *, created: bool) -> SeedResult:
    def count(model: type[object]) -> int:
        value = session.scalar(select(func.count()).select_from(model))
        return int(value or 0)

    return SeedResult(
        created=created,
        courses=count(Course),
        units=count(Unit),
        skills=count(Skill),
        lessons=count(Lesson),
        exercises=count(Exercise),
        users=count(User),
    )


def _build_course() -> tuple[Course, dict[str, Skill], dict[str, Lesson]]:
    course = Course(
        code=COURSE_CODE,
        title="Spanish for English Speakers",
        description="A playful introduction to everyday Spanish.",
        source_language="English",
        target_language="Spanish",
    )
    skills_by_key: dict[str, Skill] = {}
    lessons_by_title: dict[str, Lesson] = {}

    for unit_position, unit_seed in enumerate(COURSE_UNITS, start=1):
        unit = Unit(
            title=unit_seed.title,
            description=unit_seed.description,
            position=unit_position,
        )
        course.units.append(unit)

        for skill_position, skill_seed in enumerate(unit_seed.skills, start=1):
            skill = Skill(
                title=skill_seed.title,
                description=skill_seed.description,
                icon=skill_seed.icon,
                position=skill_position,
            )
            unit.skills.append(skill)
            skills_by_key[skill_seed.key] = skill

            for lesson_position, lesson_seed in enumerate(skill_seed.lessons, start=1):
                lesson = Lesson(
                    title=lesson_seed.title,
                    position=lesson_position,
                    xp_reward=lesson_seed.xp_reward,
                )
                skill.lessons.append(lesson)
                lessons_by_title[lesson_seed.title] = lesson

                for exercise_position, exercise_seed in enumerate(
                    lesson_seed.exercises,
                    start=1,
                ):
                    exercise = Exercise(
                        exercise_type=exercise_seed.exercise_type,
                        instruction=exercise_seed.instruction,
                        prompt=exercise_seed.prompt,
                        correct_answer=exercise_seed.correct_answer,
                        answer_data=exercise_seed.answer_data,
                        explanation=exercise_seed.explanation,
                        position=exercise_position,
                    )
                    lesson.exercises.append(exercise)

                    for option_position, option_seed in enumerate(
                        exercise_seed.options,
                        start=1,
                    ):
                        exercise.options.append(
                            ExerciseOption(
                                text=option_seed.text,
                                value=option_seed.value,
                                position=option_position,
                                is_correct=option_seed.is_correct,
                                pair_key=option_seed.pair_key,
                                match_side=option_seed.match_side,
                            )
                        )

    for unit_seed in COURSE_UNITS:
        for skill_seed in unit_seed.skills:
            skill = skills_by_key[skill_seed.key]
            skill.prerequisites = [
                skills_by_key[prerequisite_key]
                for prerequisite_key in skill_seed.prerequisite_keys
            ]

    return course, skills_by_key, lessons_by_title


def _build_learners(
    today: date,
    *,
    demo_username: str,
    demo_password: str,
) -> dict[str, User]:
    learners: dict[str, User] = {}
    for username, display_name, avatar_key, total_xp, current_streak, longest_streak in (
        LEARNER_SEEDS
    ):
        learner = User(
            username=username,
            password_hash=(
                hash_password(demo_password)
                if username == demo_username
                else "!"
            ),
            display_name=display_name,
            avatar_key=avatar_key,
            timezone="Asia/Kolkata",
            hearts=5,
            max_hearts=5,
            gems=500,
            total_xp=total_xp,
            current_streak=current_streak,
            longest_streak=longest_streak,
            last_activity_date=today,
            daily_goal_xp=20,
        )
        learners[username] = learner

    return learners


def _ensure_demo_credentials(
    session: Session,
    *,
    demo_username: str,
    demo_password: str,
) -> None:
    learner = session.scalar(select(User).where(User.username == demo_username))
    if learner is None:
        return

    if not password_matches(demo_password, learner.password_hash):
        learner.password_hash = hash_password(demo_password)
        session.commit()


def _add_default_learner_progress(
    session: Session,
    learner: User,
    skills_by_key: dict[str, Skill],
    lessons_by_title: dict[str, Lesson],
    achievements_by_code: dict[str, Achievement],
    today: date,
) -> None:
    first_lesson = lessons_by_title["Basics 1"]

    for skill_key, skill in skills_by_key.items():
        learner.skill_progress.append(
            UserSkillProgress(
                skill=skill,
                lessons_completed=1 if skill_key == "basics" else 0,
                crowns=0,
                is_unlocked=skill_key == "basics",
                is_completed=False,
                completed_at=None,
            )
        )

    completed_at = datetime.now(UTC)
    attempt = LessonAttempt(
        lesson=first_lesson,
        status=AttemptStatus.COMPLETED,
        hearts_at_start=5,
        hearts_remaining=5,
        correct_count=len(first_lesson.exercises),
        wrong_count=0,
        xp_earned=first_lesson.xp_reward,
        started_at=completed_at,
        completed_at=completed_at,
    )
    learner.lesson_attempts.append(attempt)

    for exercise in first_lesson.exercises:
        attempt.answers.append(
            AttemptAnswer(
                exercise=exercise,
                submitted_answer={"value": exercise.correct_answer},
                is_correct=True,
                feedback="Correct",
            )
        )

    learner.daily_activity.append(
        DailyActivity(
            activity_date=today,
            xp_earned=first_lesson.xp_reward,
            lessons_completed=1,
        )
    )
    learner.achievements.append(
        UserAchievement(
            achievement=achievements_by_code["first-step"],
            unlocked_at=completed_at,
        )
    )
    session.add(learner)


def seed_database(
    session: Session,
    *,
    today: date | None = None,
    demo_username: str = DEFAULT_DEMO_USERNAME,
    demo_password: str = DEFAULT_DEMO_PASSWORD,
) -> SeedResult:
    existing_course = session.scalar(select(Course.id).where(Course.code == COURSE_CODE))
    if existing_course is not None:
        _ensure_demo_credentials(
            session,
            demo_username=demo_username,
            demo_password=demo_password,
        )
        return _database_counts(session, created=False)

    seed_date = today or date.today()

    try:
        course, skills_by_key, lessons_by_title = _build_course()
        learners = _build_learners(
            seed_date,
            demo_username=demo_username,
            demo_password=demo_password,
        )
        achievements_by_code = {
            code: Achievement(
                code=code,
                title=title,
                description=description,
                icon=icon,
                xp_reward=xp_reward,
            )
            for code, title, description, icon, xp_reward in ACHIEVEMENT_SEEDS
        }

        session.add(course)
        session.add_all(learners.values())
        session.add_all(achievements_by_code.values())
        _add_default_learner_progress(
            session,
            learners["learner"],
            skills_by_key,
            lessons_by_title,
            achievements_by_code,
            seed_date,
        )
        session.commit()
    except Exception:
        session.rollback()
        raise

    return _database_counts(session, created=True)
