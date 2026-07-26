from dataclasses import dataclass
from typing import Any

from app.models import ExerciseType, MatchSide


@dataclass(frozen=True, slots=True)
class OptionSeed:
    text: str
    value: str
    is_correct: bool = False
    pair_key: str | None = None
    match_side: MatchSide | None = None


@dataclass(frozen=True, slots=True)
class ExerciseSeed:
    exercise_type: ExerciseType
    instruction: str
    prompt: str
    correct_answer: str | None
    explanation: str
    options: tuple[OptionSeed, ...] = ()
    answer_data: dict[str, Any] | None = None


@dataclass(frozen=True, slots=True)
class LessonSeed:
    title: str
    exercises: tuple[ExerciseSeed, ...]
    xp_reward: int = 10


@dataclass(frozen=True, slots=True)
class SkillSeed:
    key: str
    title: str
    description: str
    icon: str
    lessons: tuple[LessonSeed, ...]
    prerequisite_keys: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class UnitSeed:
    title: str
    description: str
    skills: tuple[SkillSeed, ...]


def multiple_choice(
    prompt: str,
    correct_text: str,
    correct_value: str,
    distractors: tuple[tuple[str, str], ...],
    explanation: str,
) -> ExerciseSeed:
    return ExerciseSeed(
        exercise_type=ExerciseType.MULTIPLE_CHOICE,
        instruction="Choose the correct translation",
        prompt=prompt,
        correct_answer=correct_value,
        explanation=explanation,
        options=(
            OptionSeed(correct_text, correct_value, is_correct=True),
            *(OptionSeed(text, value) for text, value in distractors),
        ),
    )


def word_bank(
    prompt: str,
    correct_answer: str,
    tokens: tuple[str, ...],
    explanation: str,
) -> ExerciseSeed:
    return ExerciseSeed(
        exercise_type=ExerciseType.WORD_BANK,
        instruction="Build the sentence",
        prompt=prompt,
        correct_answer=correct_answer,
        explanation=explanation,
        options=tuple(OptionSeed(token, token.casefold()) for token in tokens),
        answer_data={"accepted_answer": correct_answer},
    )


def match_pairs(
    pairs: tuple[tuple[str, str], ...],
    explanation: str,
) -> ExerciseSeed:
    options: list[OptionSeed] = []
    for index, (english, spanish) in enumerate(pairs, start=1):
        pair_key = f"pair-{index}"
        options.extend(
            (
                OptionSeed(
                    english,
                    english.casefold(),
                    pair_key=pair_key,
                    match_side=MatchSide.LEFT,
                ),
                OptionSeed(
                    spanish,
                    spanish.casefold(),
                    pair_key=pair_key,
                    match_side=MatchSide.RIGHT,
                ),
            )
        )

    return ExerciseSeed(
        exercise_type=ExerciseType.MATCH_PAIRS,
        instruction="Match the pairs",
        prompt="Select the matching English and Spanish words",
        correct_answer=None,
        explanation=explanation,
        options=tuple(options),
        answer_data={"pair_count": len(pairs)},
    )


def fill_blank(
    prompt: str,
    correct_answer: str,
    explanation: str,
) -> ExerciseSeed:
    return ExerciseSeed(
        exercise_type=ExerciseType.FILL_BLANK,
        instruction="Fill in the blank",
        prompt=prompt,
        correct_answer=correct_answer,
        explanation=explanation,
    )


def type_answer(
    prompt: str,
    correct_answer: str,
    explanation: str,
) -> ExerciseSeed:
    return ExerciseSeed(
        exercise_type=ExerciseType.TYPE_ANSWER,
        instruction="Type the answer in Spanish",
        prompt=prompt,
        correct_answer=correct_answer,
        explanation=explanation,
    )


COURSE_UNITS = (
    UnitSeed(
        title="First Steps",
        description="Build a foundation with everyday Spanish.",
        skills=(
            SkillSeed(
                key="basics",
                title="Basics",
                description="Introduce yourself with essential words.",
                icon="book-open",
                lessons=(
                    LessonSeed(
                        title="Basics 1",
                        exercises=(
                            multiple_choice(
                                "Hello",
                                "Hola",
                                "hola",
                                (("Gracias", "gracias"), ("Adiós", "adiós")),
                                "Hola is the most common way to say hello.",
                            ),
                            word_bank(
                                "I am a boy",
                                "yo soy un niño",
                                ("niño", "soy", "Yo", "una", "un"),
                                "Use soy for I am, followed by un niño.",
                            ),
                            match_pairs(
                                (
                                    ("hello", "hola"),
                                    ("goodbye", "adiós"),
                                    ("thanks", "gracias"),
                                ),
                                "These are common words used in short conversations.",
                            ),
                            fill_blank(
                                "Yo ___ Ana.",
                                "soy",
                                "Soy is the first-person form of ser: I am.",
                            ),
                            type_answer(
                                "Translate: Thank you",
                                "gracias",
                                "Gracias means thank you.",
                            ),
                        ),
                    ),
                    LessonSeed(
                        title="Basics 2",
                        exercises=(
                            multiple_choice(
                                "The girl",
                                "La niña",
                                "la niña",
                                (("El niño", "el niño"), ("La mujer", "la mujer")),
                                "Niña means girl and uses the feminine article la.",
                            ),
                            word_bank(
                                "He is a man",
                                "él es un hombre",
                                ("hombre", "Él", "una", "es", "un"),
                                "Use él es for he is and un hombre for a man.",
                            ),
                            match_pairs(
                                (
                                    ("boy", "niño"),
                                    ("girl", "niña"),
                                    ("woman", "mujer"),
                                ),
                                "Spanish nouns often show grammatical gender.",
                            ),
                            fill_blank(
                                "Ella ___ una niña.",
                                "es",
                                "Es is used for he, she, or it is.",
                            ),
                            type_answer(
                                "Translate: The boy",
                                "el niño",
                                "The masculine article el goes with niño.",
                            ),
                        ),
                    ),
                ),
            ),
            SkillSeed(
                key="greetings",
                title="Greetings",
                description="Start and finish friendly conversations.",
                icon="hand",
                prerequisite_keys=("basics",),
                lessons=(
                    LessonSeed(
                        title="Greetings 1",
                        exercises=(
                            multiple_choice(
                                "Good morning",
                                "Buenos días",
                                "buenos días",
                                (("Buenas noches", "buenas noches"), ("Hola", "hola")),
                                "Buenos días is used as a morning greeting.",
                            ),
                            word_bank(
                                "Nice to meet you",
                                "mucho gusto",
                                ("gusto", "Mucho", "gracias", "días"),
                                "Mucho gusto is the standard phrase for nice to meet you.",
                            ),
                            match_pairs(
                                (
                                    ("good morning", "buenos días"),
                                    ("good night", "buenas noches"),
                                    ("please", "por favor"),
                                ),
                                "Greetings change with context and time of day.",
                            ),
                            fill_blank(
                                "¿Cómo ___?",
                                "estás",
                                "¿Cómo estás? asks how someone is informally.",
                            ),
                            type_answer(
                                "Translate: See you later",
                                "hasta luego",
                                "Hasta luego is a friendly way to say see you later.",
                            ),
                        ),
                    ),
                ),
            ),
            SkillSeed(
                key="food",
                title="Food",
                description="Talk about simple meals and drinks.",
                icon="apple",
                prerequisite_keys=("greetings",),
                lessons=(
                    LessonSeed(
                        title="Food 1",
                        exercises=(
                            multiple_choice(
                                "The apple",
                                "La manzana",
                                "la manzana",
                                (("El pan", "el pan"), ("El queso", "el queso")),
                                "Manzana means apple and is feminine.",
                            ),
                            word_bank(
                                "I eat bread",
                                "yo como pan",
                                ("pan", "Yo", "bebo", "como", "agua"),
                                "Como is the first-person form of comer: I eat.",
                            ),
                            match_pairs(
                                (
                                    ("bread", "pan"),
                                    ("water", "agua"),
                                    ("cheese", "queso"),
                                ),
                                "These food words are useful in cafés and markets.",
                            ),
                            fill_blank(
                                "Bebo ___.",
                                "agua",
                                "Bebo agua means I drink water.",
                            ),
                            type_answer(
                                "Translate: Cheese",
                                "queso",
                                "Queso means cheese.",
                            ),
                        ),
                    ),
                ),
            ),
        ),
    ),
    UnitSeed(
        title="Everyday Life",
        description="Talk about people and places around you.",
        skills=(
            SkillSeed(
                key="family",
                title="Family",
                description="Describe close family members.",
                icon="users",
                prerequisite_keys=("food",),
                lessons=(
                    LessonSeed(
                        title="Family 1",
                        exercises=(
                            multiple_choice(
                                "My mother",
                                "Mi madre",
                                "mi madre",
                                (("Mi padre", "mi padre"), ("Mi hermana", "mi hermana")),
                                "Madre means mother and mi means my.",
                            ),
                            word_bank(
                                "She is my sister",
                                "ella es mi hermana",
                                ("hermana", "Él", "mi", "Ella", "es"),
                                "Ella es mi hermana means she is my sister.",
                            ),
                            match_pairs(
                                (
                                    ("mother", "madre"),
                                    ("father", "padre"),
                                    ("brother", "hermano"),
                                ),
                                "Family words share recognizable masculine and feminine endings.",
                            ),
                            fill_blank(
                                "Mi ___ se llama Ana.",
                                "madre",
                                "Mi madre se llama Ana means my mother's name is Ana.",
                            ),
                            type_answer(
                                "Translate: Brother",
                                "hermano",
                                "Hermano means brother.",
                            ),
                        ),
                    ),
                ),
            ),
            SkillSeed(
                key="travel",
                title="Travel",
                description="Find important places while travelling.",
                icon="plane",
                prerequisite_keys=("family",),
                lessons=(
                    LessonSeed(
                        title="Travel 1",
                        exercises=(
                            multiple_choice(
                                "The station",
                                "La estación",
                                "la estación",
                                (("El hotel", "el hotel"), ("El aeropuerto", "el aeropuerto")),
                                "Estación means station and is feminine.",
                            ),
                            word_bank(
                                "Where is the hotel?",
                                "¿dónde está el hotel?",
                                ("hotel?", "el", "Dónde", "está", "es"),
                                "Use dónde está to ask where a place is.",
                            ),
                            match_pairs(
                                (
                                    ("hotel", "hotel"),
                                    ("airport", "aeropuerto"),
                                    ("ticket", "boleto"),
                                ),
                                "These words help with basic travel navigation.",
                            ),
                            fill_blank(
                                "Necesito un ___.",
                                "taxi",
                                "Necesito un taxi means I need a taxi.",
                            ),
                            type_answer(
                                "Translate: Airport",
                                "aeropuerto",
                                "Aeropuerto means airport.",
                            ),
                        ),
                    ),
                ),
            ),
        ),
    ),
)

ACHIEVEMENT_SEEDS = (
    ("first-step", "First Step", "Complete your first lesson.", "footprints", 5),
    ("xp-100", "XP Explorer", "Earn 100 total XP.", "sparkles", 10),
    ("week-warrior", "Week Warrior", "Reach a seven-day streak.", "flame", 15),
    ("perfect-lesson", "Perfect Lesson", "Finish without a mistake.", "trophy", 10),
)

LEARNER_SEEDS = (
    ("learner", "Ava", "fox", 10, 1, 1),
    ("maya", "Maya", "owl", 780, 8, 12),
    ("zara", "Zara", "bear", 650, 5, 9),
    ("leo", "Leo", "lion", 420, 2, 6),
    ("noah", "Noah", "panda", 310, 1, 4),
)
