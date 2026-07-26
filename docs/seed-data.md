# Seed data

The seed catalog makes the application useful immediately after setup while
remaining small enough to understand during an interview.

## Command

Apply migrations first, then seed from the repository root:

```bash
pnpm db:migrate
pnpm db:seed
```

Expected first-run output:

```text
Seed data created: 1 course, 2 units, 5 skills, 6 lessons, 30 exercises, 5 users.
```

A later run produces:

```text
Seed data already present: 1 course, 2 units, 5 skills, 6 lessons, 30 exercises, 5 users.
```

## Course structure

```text
Spanish for English Speakers
├── Unit 1: First Steps
│   ├── Basics
│   │   ├── Basics 1
│   │   └── Basics 2
│   ├── Greetings
│   │   └── Greetings 1
│   └── Food
│       └── Food 1
└── Unit 2: Everyday Life
    ├── Family
    │   └── Family 1
    └── Travel
        └── Travel 1
```

The dependency path is:

```text
Basics → Greetings → Food → Family → Travel
```

The dependency edges are stored explicitly in `skill_prerequisites`; they are
not inferred from the visual position.

## Exercise coverage

Every lesson contains five exercises. The dataset has 30 exercises and covers
all assignment requirements:

- Multiple choice
- Word-bank translation
- Match pairs
- Fill in the blank
- Type the answer

Options are relational rows. Small type-specific values, such as accepted word
sequences and expected pair count, use the exercise `answer_data` JSON field.

## Default learner

The default learner has username `learner` and display name `Ava`.

Local authentication:

```text
Username: learner
Password: LingoTrail@123
```

Only the Argon2id password hash is stored in SQLite. The other four seeded
leaderboard users have unusable password markers and cannot log in.

Seeded state:

- Five hearts and 500 mocked gems
- 10 lifetime XP
- One-day current and longest streak
- A 20 XP daily goal
- One completed lesson attempt
- Ten XP earned today
- One of two Basics lessons completed
- Basics unlocked; later skills locked
- The `First Step` achievement unlocked

The completed attempt also contains five submitted answer rows. This keeps the
sample progress backed by an audit trail instead of inserting only a progress
summary.

## Leaderboard

```text
1. Maya   780 XP
2. Zara   650 XP
3. Leo    420 XP
4. Noah   310 XP
5. Ava     10 XP
```

These are real user rows, not a frontend-only array. The leaderboard API can
therefore use the same query it would use for multiple real learners.

Ava's XP and streak summaries exactly match her seeded attempt and daily
activity. The other accounts are mocked competitors, as permitted by the
assignment, and only need ranking summaries.

## Achievements

The seed defines:

- First Step
- XP Explorer
- Week Warrior
- Perfect Lesson

Only First Step is initially awarded to the default learner.

## Idempotency and transaction design

`courses.code` is a unique natural identifier. The seed service checks for the
stable code `es-en` before inserting.

All course content, learners, progress, activity, attempts, answers, and
achievements are inserted in one transaction:

```text
Check course code
→ Build complete object graph
→ Add graph to one session
→ Commit once
```

If any insert fails, the transaction is rolled back. Therefore the seed cannot
leave a half-created catalog. Once the course exists, another run is a no-op and
returns current counts.

The seed operation is a bootstrap mechanism, not a synchronization engine.
Future schema changes belong in Alembic migrations, and deliberate content
updates should use a separately versioned content migration or administration
workflow.
