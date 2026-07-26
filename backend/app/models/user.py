from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.progress import (
        DailyActivity,
        LessonAttempt,
        UserAchievement,
        UserSkillProgress,
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("hearts >= 0", name="non_negative_hearts"),
        CheckConstraint("max_hearts > 0", name="positive_max_hearts"),
        CheckConstraint("hearts <= max_hearts", name="hearts_within_max"),
        CheckConstraint("total_xp >= 0", name="non_negative_total_xp"),
        CheckConstraint("gems >= 0", name="non_negative_gems"),
        CheckConstraint("current_streak >= 0", name="non_negative_current_streak"),
        CheckConstraint("longest_streak >= 0", name="non_negative_longest_streak"),
        CheckConstraint("daily_goal_xp > 0", name="positive_daily_goal"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), default="!")
    display_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str | None] = mapped_column(String(255), unique=True)
    avatar_key: Mapped[str] = mapped_column(String(50), default="fox")
    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    hearts: Mapped[int] = mapped_column(default=5)
    max_hearts: Mapped[int] = mapped_column(default=5)
    gems: Mapped[int] = mapped_column(default=500)
    total_xp: Mapped[int] = mapped_column(default=0)
    current_streak: Mapped[int] = mapped_column(default=0)
    longest_streak: Mapped[int] = mapped_column(default=0)
    last_activity_date: Mapped[date | None] = mapped_column(Date)
    daily_goal_xp: Mapped[int] = mapped_column(default=20)

    skill_progress: Mapped[list[UserSkillProgress]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    lesson_attempts: Mapped[list[LessonAttempt]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    daily_activity: Mapped[list[DailyActivity]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    achievements: Mapped[list[UserAchievement]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
