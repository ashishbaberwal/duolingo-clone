# Seed data

The seed catalog makes the application useful immediately after setup while
remaining small enough to explain in an interview. It seeds reusable learning
content and leaderboard context—not a shared learner account.

## Command

Apply migrations first, then seed from the repository root:

```bash
pnpm db:migrate
pnpm db:seed
```

Expected first-run output:

```text
Seed data created: 1 course, 2 units, 5 skills, 6 lessons, 30 exercises, 4 users.
```

A later run reports the same counts as already present.

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

The stored dependency graph is:

```text
Basics → Greetings → Food → Family → Travel
```

Edges live in `skill_prerequisites`; they are not inferred from visual
position.

## Exercise coverage

Every lesson contains five exercises. The 30-exercise catalog covers:

- multiple choice;
- word-bank translation;
- match pairs;
- fill in the blank;
- type the answer.

Options are relational rows. Small type-specific values, such as accepted word
sequences and expected pair count, use the exercise `answer_data` JSON field.

## Registered learners

Learners are created through `/signup`, not by the seed command. Every fresh
account starts with:

- 5 of 5 hearts;
- 500 gems;
- 0 lifetime and daily XP;
- 0 current and longest streak;
- a 20 XP daily goal;
- no attempts, activity, progress, or achievements;
- Basics available and prerequisite-dependent skills locked.

This makes progress isolation easy to reason about: all mutable rows reference
the authenticated user's database ID.

## Leaderboard competitors

```text
1. Maya  780 XP
2. Zara  650 XP
3. Leo   420 XP
4. Noah  310 XP
```

These are real `users` rows so the leaderboard exercises the same SQL query as
registered users. They are deliberately leaderboard-only: no email, an
unusable password marker, and no attempt/progress history. A new learner with
0 XP is ranked after them and marked `YOU`; lesson XP changes the ordering
dynamically.

## Achievements

The reusable achievement definitions are:

- First Step;
- XP Explorer;
- Week Warrior;
- Perfect Lesson.

They are awarded to registered learners only when service rules are satisfied.

## Idempotency and transaction design

`courses.code` is the stable unique identifier. The seed service checks
`es-en` before inserting.

The complete course graph, achievement definitions, and four competitor users
are inserted in one transaction:

```text
Check course code
→ Build complete object graph
→ Add graph to one session
→ Commit once
```

If insertion fails, the transaction rolls back. Once the course exists,
another run is a no-op that reports current counts, so redeployment cannot
duplicate content or overwrite registered-user progress.
