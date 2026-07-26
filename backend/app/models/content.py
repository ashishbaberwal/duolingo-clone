from __future__ import annotations

from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Column,
    Enum,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import ExerciseType, MatchSide

skill_prerequisites = Table(
    "skill_prerequisites",
    Base.metadata,
    Column(
        "skill_id",
        ForeignKey("skills.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "prerequisite_skill_id",
        ForeignKey("skills.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    CheckConstraint(
        "skill_id != prerequisite_skill_id",
        name="different_skills",
    ),
)


class Course(TimestampMixin, Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text)
    source_language: Mapped[str] = mapped_column(String(50))
    target_language: Mapped[str] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    units: Mapped[list[Unit]] = relationship(
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Unit.position",
    )


class Unit(TimestampMixin, Base):
    __tablename__ = "units"
    __table_args__ = (
        UniqueConstraint("course_id", "position"),
        CheckConstraint("position > 0", name="positive_position"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        index=True,
    )
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer)

    course: Mapped[Course] = relationship(back_populates="units")
    skills: Mapped[list[Skill]] = relationship(
        back_populates="unit",
        cascade="all, delete-orphan",
        order_by="Skill.position",
    )


class Skill(TimestampMixin, Base):
    __tablename__ = "skills"
    __table_args__ = (
        UniqueConstraint("unit_id", "position"),
        CheckConstraint("position > 0", name="positive_position"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    unit_id: Mapped[int] = mapped_column(
        ForeignKey("units.id", ondelete="CASCADE"),
        index=True,
    )
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(String(50), default="star")
    position: Mapped[int] = mapped_column(Integer)

    unit: Mapped[Unit] = relationship(back_populates="skills")
    lessons: Mapped[list[Lesson]] = relationship(
        back_populates="skill",
        cascade="all, delete-orphan",
        order_by="Lesson.position",
    )
    prerequisites: Mapped[list[Skill]] = relationship(
        secondary=skill_prerequisites,
        primaryjoin=id == skill_prerequisites.c.skill_id,
        secondaryjoin=id == skill_prerequisites.c.prerequisite_skill_id,
        back_populates="unlocks",
    )
    unlocks: Mapped[list[Skill]] = relationship(
        secondary=skill_prerequisites,
        primaryjoin=id == skill_prerequisites.c.prerequisite_skill_id,
        secondaryjoin=id == skill_prerequisites.c.skill_id,
        back_populates="prerequisites",
    )


class Lesson(TimestampMixin, Base):
    __tablename__ = "lessons"
    __table_args__ = (
        UniqueConstraint("skill_id", "position"),
        CheckConstraint("position > 0", name="positive_position"),
        CheckConstraint("xp_reward > 0", name="positive_xp_reward"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"),
        index=True,
    )
    title: Mapped[str] = mapped_column(String(120))
    position: Mapped[int] = mapped_column(Integer)
    xp_reward: Mapped[int] = mapped_column(Integer, default=10)

    skill: Mapped[Skill] = relationship(back_populates="lessons")
    exercises: Mapped[list[Exercise]] = relationship(
        back_populates="lesson",
        cascade="all, delete-orphan",
        order_by="Exercise.position",
    )


class Exercise(TimestampMixin, Base):
    __tablename__ = "exercises"
    __table_args__ = (
        UniqueConstraint("lesson_id", "position"),
        CheckConstraint("position > 0", name="positive_position"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE"),
        index=True,
    )
    exercise_type: Mapped[ExerciseType] = mapped_column(
        Enum(
            ExerciseType,
            name="exercise_type",
            native_enum=False,
            values_callable=lambda choices: [choice.value for choice in choices],
        )
    )
    instruction: Mapped[str] = mapped_column(String(160))
    prompt: Mapped[str] = mapped_column(Text)
    correct_answer: Mapped[str | None] = mapped_column(Text)
    answer_data: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    explanation: Mapped[str | None] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer)

    lesson: Mapped[Lesson] = relationship(back_populates="exercises")
    options: Mapped[list[ExerciseOption]] = relationship(
        back_populates="exercise",
        cascade="all, delete-orphan",
        order_by="ExerciseOption.position",
    )


class ExerciseOption(TimestampMixin, Base):
    __tablename__ = "exercise_options"
    __table_args__ = (
        UniqueConstraint("exercise_id", "position"),
        CheckConstraint("position > 0", name="positive_position"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"),
        index=True,
    )
    text: Mapped[str] = mapped_column(String(255))
    value: Mapped[str] = mapped_column(String(255))
    position: Mapped[int] = mapped_column(Integer)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    pair_key: Mapped[str | None] = mapped_column(String(64))
    match_side: Mapped[MatchSide | None] = mapped_column(
        Enum(
            MatchSide,
            name="match_side",
            native_enum=False,
            values_callable=lambda choices: [choice.value for choice in choices],
        )
    )

    exercise: Mapped[Exercise] = relationship(back_populates="options")
