# ADR 002: Relational domain model

- Status: Accepted
- Date: 2026-07-26

## Context

The application must persist hierarchical course content, a potentially
branching learning path, interactive lesson attempts, hearts, XP, streaks,
achievements, and per-user progress. Database design is an explicit evaluation
criterion.

## Decision

Use normalized SQLAlchemy 2 declarative models backed by SQLite. Manage schema
history with Alembic rather than calling `Base.metadata.create_all()` when the
application starts.

Split the model into three conceptual groups:

1. Course content: courses, units, skills, lessons, exercises, and options.
2. Learner state: users, skill progress, daily activity, and achievements.
3. Attempt history: lesson attempts and submitted answers.

Represent skill dependencies with a self-referencing many-to-many table. Use
database constraints for states that must never be invalid and application
services for rules that require domain context.

## Why migrations instead of automatic table creation

`create_all()` can create missing tables, but it is not a history of how a
deployed database changed. Alembic provides ordered, reviewable upgrades and
downgrades and can detect drift between metadata and migrations.

## Why both attempt history and progress summaries

Attempt and answer rows are the audit trail: they explain what a learner did.
`user_skill_progress` and summary fields on `users` make common path and top-bar
reads inexpensive.

This is intentional denormalization. Later service methods must update the audit
record and summaries in one database transaction so they cannot disagree.

## Why exercise options are relational but answer data may be JSON

Selectable options have stable, queryable structure and belong in their own
table. Some exercise types need small variable payloads, such as an accepted
word sequence. Creating a new table for every exercise subtype would increase
joins and migration work without improving the assignment.

The shared exercise fields remain relational, while `answer_data` is a narrow
escape hatch for type-specific data. Validation will occur at the API and
service boundaries.

## Why prerequisites are not inferred from position

Position controls visual ordering. It does not fully describe dependency.
Explicit prerequisite edges allow branches and make lock calculations
deterministic without coupling progression rules to page layout.

## Why summary XP is stored on the user

Leaderboard and top-bar requests read total XP frequently. Storing the summary
avoids aggregating all historical attempts for every request. Successful lesson
completion will update the attempt, daily activity, and user total atomically.

## Consequences

- The schema contains more tables than a document-style design, but
  relationships and integrity rules are explicit.
- SQLite foreign keys must be enabled on each connection.
- Service-layer transactions are required when updating summary and history
  records together.
- A move to PostgreSQL remains practical because the models use portable
  SQLAlchemy types and named constraints.
- The initial migration must pass upgrade, downgrade, and drift checks before
  it can be committed.
