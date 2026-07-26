# Lesson loop

The lesson player implements the assignment's core learning cycle with five
seeded exercise types:

```text
multiple choice
word bank / tap the words
match pairs
fill in the blank
type the answer
```

## End-to-end flow

```text
Path selects next lesson
        |
        v
GET public lesson content
        |
        v
POST start/resume attempt
        |
        v
React renders current exercise and keeps only the draft locally
        |
        v
POST answer -> FastAPI evaluates private canonical data
        |
        +--> correct/incorrect feedback bar
        +--> persistent heart update
        +--> next exercise
        |
        v
Final answer -> XP + activity + streak + skill progress
        |
        v
Completion celebration -> refreshed learning path
```

## Why correctness is server-side

The lesson read contract excludes:

- canonical answers;
- option correctness flags;
- match-pair keys;
- explanations.

If React received these fields, a learner could reveal them through browser
developer tools before answering. FastAPI loads the private exercise row only
after receiving a submission. The response may then safely reveal explanation
and corrective guidance for that completed exercise.

## Answer contracts

The shared envelope contains `exercise_id` and exactly one answer shape:

```json
{
  "exercise_id": 12,
  "answer": {
    "tokens": ["él", "es", "un", "hombre"]
  }
}
```

- Multiple choice submits the selected option value.
- Word bank submits ordered token values. The backend rejects tokens not
  offered by that exercise.
- Match pairs submit left/right option IDs. The server verifies side,
  uniqueness, complete coverage, and hidden pair keys.
- Fill blank and type answer submit text.

Text comparison is case- and punctuation-insensitive and collapses whitespace.
Unicode normalization keeps equivalent character encoding stable while
preserving meaningful Spanish accents.

## Attempt invariants

An attempt is an append-only learning audit:

1. Only the authenticated owner can access it.
2. Only an `in_progress` attempt accepts answers.
3. Exercises must be answered in lesson order.
4. The `(attempt_id, exercise_id)` database constraint is the final duplicate
   guard.
5. Zero hearts closes the attempt as `failed`.
6. A failed attempt is never rewritten; refill and retry create a new attempt.
7. Starting the same lesson resumes its existing active attempt.

## Completion transaction

The final answer and all gamification updates share one SQLAlchemy transaction.
Either all of these persist, or none do:

- answer audit row and correctness count;
- attempt completion and XP earned;
- learner total XP;
- local-date daily activity;
- streak and longest-streak summary;
- lesson and skill progress.

Practice completions still award XP, but the same lesson cannot increment
`lessons_completed` or crowns twice.

## Frontend ownership

```text
TanStack Query:
  lesson content, start mutation, answer mutation, refill mutation

LessonPlayer:
  current attempt projection, answer draft, feedback transition, outcome state

Exercise components:
  only the interaction required to build their typed answer payload
```

No Redux or Zustand store is needed. A backend attempt provides durable resume,
and all short-lived UI state has one controller.

## Failure handling

- Lesson-loading and lesson-start failures have retry states.
- Invalid or unavailable lessons return to the path cleanly.
- Answer network failures preserve the current draft for retry.
- Wrong answers show immediate red feedback and decrement hearts.
- Zero hearts shows a dedicated refill/return outcome.
- Completion shows XP and streak before returning to the refreshed path.

## Interview answer

> The frontend is an interaction renderer, not the authority. It builds a typed
> answer payload and sends it with the current exercise ID. FastAPI verifies
> ownership, attempt status and exercise order, evaluates private answer data,
> persists the audit row and heart change, then returns safe feedback. On the
> last exercise it updates XP, streak, daily activity and skill progress in the
> same transaction, preventing partially completed gamification state.
