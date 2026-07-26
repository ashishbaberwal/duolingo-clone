# API guide

The FastAPI application exposes versioned learner-facing endpoints under
`/api/v1`. All responses are validated by Pydantic models and included in the
generated OpenAPI document.

Local documentation:

```text
Swagger UI: http://localhost:8000/docs
OpenAPI:    http://localhost:8000/openapi.json
```

## Authentication

Learner endpoints require the `lingotrail_session` HttpOnly cookie. Without a
valid session they return:

```http
401 Unauthorized
```

```json
{
  "detail": "Authentication required."
}
```

Use the local login endpoint with the documented demo credentials:

```http
POST /api/v1/auth/login
```

Current-user and logout endpoints are:

```text
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

See the [authentication guide](authentication.md) for request bodies, cookie
properties, and token validation.

## Learning path

```http
GET /api/v1/path
```

Returns:

- Course identity and languages
- Top-bar learner statistics
- Ordered units, skills, and lessons
- Skill state: `completed`, `available`, or `locked`
- Completed and total lesson counts
- Crowns
- Prerequisite skill IDs
- The next lesson the learner should start

Path state rules:

```text
Completed progress row
→ completed

Explicitly unlocked, no prerequisites, or all prerequisites completed
→ available

Otherwise
→ locked
```

For an available skill, `next_lesson_id` is the first lesson without a
successful attempt. If every lesson is complete, it points to the first lesson
for practice. Locked skills return `null`.

## Lesson content

```http
GET /api/v1/lessons/{lesson_id}
```

An available lesson returns its public exercise content and selectable options.

Possible errors:

```text
404 - lesson does not exist
403 - prerequisite skills are incomplete
401 - authentication is missing or invalid
```

### Answer privacy

The learner-facing response intentionally excludes:

- `correct_answer`
- `answer_data`
- `explanation`
- Option `is_correct`
- Match option `pair_key`

The frontend receives only the information required to render an exercise:

```text
id
exercise_type
instruction
prompt
position
options: id, text, value, position, match_side
```

Correctness remains private until the answer-submission endpoint checks the
stored answer. Hiding UI elements is not a security boundary; excluding answer
data from the JSON response is.

## Lesson attempts

Start a new attempt or resume the learner's existing in-progress attempt:

```http
POST /api/v1/lessons/{lesson_id}/attempts
```

The response identifies the current exercise, answered count, lesson size,
attempt status, and remaining hearts. Repeating the request is idempotent while
an active attempt exists.

Submit exactly one answer for the current exercise:

```http
POST /api/v1/attempts/{attempt_id}/answers
```

```json
{
  "exercise_id": 12,
  "answer": {
    "value": "la niña"
  }
}
```

The answer object uses one shape according to exercise type:

```text
multiple_choice -> value
word_bank       -> ordered tokens
match_pairs     -> left/right option ID pairs
fill_blank      -> text
type_answer     -> text
```

The response returns immediate correctness, learner-safe feedback, the
canonical answer after an incorrect non-match submission, explanation, updated
hearts, attempt progress, and the next exercise ID.

The API rejects:

```text
404 - attempt is absent or belongs to another learner
409 - attempt is closed, or exercise is skipped/repeated
422 - answer shape is invalid for the exercise
```

On the final answer, one transaction:

1. completes the attempt;
2. awards lesson XP;
3. updates today's activity and streak;
4. advances skill progress without double-counting practice;
5. returns refreshed learner statistics.

Wrong answers decrement both the learner's persistent hearts and the attempt
snapshot. Reaching zero marks the attempt failed.

## Heart refill

The assignment permits a mocked refill:

```http
POST /api/v1/hearts/refill
```

It restores the authenticated learner to `max_hearts`. A failed attempt remains
an immutable audit record; retrying creates a new attempt.

## Profile

```http
GET /api/v1/profile
```

Combines:

- Learner identity
- Hearts, gems, XP, streak, and daily goal
- XP earned on the learner's current local date
- Longest streak
- Distinct completed lesson count
- Completed skill count
- Earned achievements

SQLite does not retain timezone offsets. The service normalizes stored
achievement timestamps to UTC before serialization, so the API emits an
unambiguous `Z` timestamp.

## Leaderboard

```http
GET /api/v1/leaderboard
```

Ranks users by:

```text
total_xp descending
→ username ascending for deterministic ties
```

Every entry has an explicit rank and `is_current_learner` flag. The response
also includes `current_learner_rank`, allowing the UI to locate the learner
without repeating ranking logic.

## Layer flow

```text
HTTP route
→ FastAPI dependency
→ Application service
→ Repository query
→ SQLAlchemy session
→ SQLite
```

Routes translate HTTP concepts such as 403 or 404. Services calculate learner
state and build response contracts. Repositories own reusable loading queries.
Pydantic schemas define exactly what crosses the public boundary.
