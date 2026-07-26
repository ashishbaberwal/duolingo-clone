# ADR 006: Server-authoritative lesson attempt lifecycle

- Status: Accepted
- Date: 2026-07-26

## Context

The lesson player must support five exercise types, immediate feedback, heart
loss, resumable progress, failure, XP, streaks, and skill completion. Canonical
answers and match keys must not be exposed before submission.

## Decision

Represent one play session as a persistent `lesson_attempts` row and each
submission as one `attempt_answers` row.

Use three command endpoints:

```text
POST /lessons/{lesson_id}/attempts
POST /attempts/{attempt_id}/answers
POST /hearts/refill
```

Separate backend responsibilities:

```text
route               HTTP status translation
attempt service     ownership, order, status, and orchestration
answer evaluator    exercise-specific correctness rules
progression service XP, activity, streak, and skill completion
repository          loading and persistence queries
```

The React lesson player renders public exercise data and keeps only its current
answer draft and feedback transition locally.

## Why start and answer are separate

A single "submit whole lesson" request would prevent immediate server feedback,
make heart loss delayed, and lose resume capability. Creating an attempt first
provides a stable owner-scoped session and an audit parent for every answer.

## Why answer order is enforced

Allowing arbitrary exercise IDs would let clients skip difficult questions or
replay one easy answer. The service derives the first unanswered exercise from
the ordered lesson and rejects any other ID.

## Why completion is transactional

Attempt status, XP, daily activity, streak, and skill progress describe one
business event. Separate commits could award XP without completing progress or
complete a skill without recording activity.

## Why no new database migration

ADR 002 intentionally created attempt, answer, daily activity, and progress
tables before the API checkpoint. Their constraints already represent this
lifecycle, so implementation requires service and contract code rather than
schema churn.

## Alternatives considered

### Evaluate answers in React

Rejected because correctness fields would be discoverable and modified clients
could award their own progress.

### Store the whole attempt as JSON

Rejected because relational answer rows provide uniqueness constraints,
queryable audit history, and direct exercise relationships.

### One endpoint per exercise type

Rejected because ownership, ordering, hearts, persistence, and feedback are the
same workflow. A typed answer union keeps one stable endpoint while the
evaluator dispatches by stored exercise type.

### Add Redux or Zustand

Rejected because durable session state already belongs to FastAPI and SQLite.
The remaining draft/feedback state has one React owner.

## Consequences

- Clients cannot learn canonical correctness from the lesson-read response.
- Attempts resume after navigation or refresh.
- Closed attempts are immutable audit records.
- Practice can award XP without double-counting structural progress.
- More explicit schemas and services exist, but each has one explainable role.
