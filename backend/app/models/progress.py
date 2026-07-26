from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import AttemptStatus

if TYPE_CHECKING:
    from app.models.content import Exercise, Lesson, Skill
    from app.models.user import User


class UserSkillProgress(TimestampMixin, Base):
    __tablename__ = "user_skill_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "skill_id"),
        CheckConstraint("lessons_completed >= 0", name="non_negative_lessons"),
        CheckConstraint("crowns >= 0", name="non_negative_crowns"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"),
        index=True,
    )
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)
    crowns: Mapped[int] = mapped_column(Integer, default=0)
    is_unlocked: Mapped[bool] = mapped_column(Boolean, default=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(back_populates="skill_progress")
    skill: Mapped[Skill] = relationship()


class LessonAttempt(TimestampMixin, Base):
    __tablename__ = "lesson_attempts"
    __table_args__ = (
        CheckConstraint("hearts_at_start >= 0", name="non_negative_starting_hearts"),
        CheckConstraint("hearts_remaining >= 0", name="non_negative_remaining_hearts"),
        CheckConstraint("correct_count >= 0", name="non_negative_correct_count"),
        CheckConstraint("wrong_count >= 0", name="non_negative_wrong_count"),
        CheckConstraint("xp_earned >= 0", name="non_negative_xp"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    lesson_id: Mapped[int] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE"),
        index=True,
    )
    status: Mapped[AttemptStatus] = mapped_column(
        Enum(
            AttemptStatus,
            name="attempt_status",
            native_enum=False,
            values_callable=lambda choices: [choice.value for choice in choices],
        ),
        default=AttemptStatus.IN_PROGRESS,
    )
    hearts_at_start: Mapped[int] = mapped_column(Integer)
    hearts_remaining: Mapped[int] = mapped_column(Integer)
    correct_count: Mapped[int] = mapped_column(Integer, default=0)
    wrong_count: Mapped[int] = mapped_column(Integer, default=0)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(back_populates="lesson_attempts")
    lesson: Mapped[Lesson] = relationship()
    answers: Mapped[list[AttemptAnswer]] = relationship(
        back_populates="attempt",
        cascade="all, delete-orphan",
    )


class AttemptAnswer(TimestampMixin, Base):
    __tablename__ = "attempt_answers"
    __table_args__ = (UniqueConstraint("attempt_id", "exercise_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[int] = mapped_column(
        ForeignKey("lesson_attempts.id", ondelete="CASCADE"),
        index=True,
    )
    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"),
        index=True,
    )
    submitted_answer: Mapped[dict[str, Any]] = mapped_column(JSON)
    is_correct: Mapped[bool] = mapped_column(Boolean)
    feedback: Mapped[str | None] = mapped_column(Text)

    attempt: Mapped[LessonAttempt] = relationship(back_populates="answers")
    exercise: Mapped[Exercise] = relationship()


class DailyActivity(TimestampMixin, Base):
    __tablename__ = "daily_activity"
    __table_args__ = (
        UniqueConstraint("user_id", "activity_date"),
        CheckConstraint("xp_earned >= 0", name="non_negative_xp"),
        CheckConstraint("lessons_completed >= 0", name="non_negative_lessons"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    activity_date: Mapped[date] = mapped_column(Date)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped[User] = relationship(back_populates="daily_activity")


class Achievement(TimestampMixin, Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True)
    title: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(String(50))
    xp_reward: Mapped[int] = mapped_column(Integer, default=0)

    users: Mapped[list[UserAchievement]] = relationship(
        back_populates="achievement",
        cascade="all, delete-orphan",
    )


class UserAchievement(TimestampMixin, Base):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    achievement_id: Mapped[int] = mapped_column(
        ForeignKey("achievements.id", ondelete="CASCADE"),
        index=True,
    )
    unlocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(back_populates="achievements")
    achievement: Mapped[Achievement] = relationship(back_populates="users")
