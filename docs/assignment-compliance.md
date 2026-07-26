# Assignment compliance matrix

This document maps the supplied `Assignment Duolingo Clone.pdf` requirements to
implemented, reviewable evidence. `Complete` means the behaviour exists in the
repository and is covered by automated or desktop-browser validation.

## Required stack and deliverables

| Requirement | Status | Evidence |
| --- | --- | --- |
| Next.js with TypeScript | Complete | `frontend/package.json`, `frontend/src/app` |
| Python with FastAPI or Django | Complete | `backend/pyproject.toml`, `backend/app/main.py` |
| SQLite with a designed schema | Complete | `backend/app/models`, Alembic migration, `docs/database-schema.md` |
| Public repository with `frontend/` and `backend/` | Complete | Public `ashishbaberwal/duolingo-clone` GitHub repository |
| README setup, stack, architecture, schema, API, assumptions | Complete | Root `README.md` and linked detailed guides |
| Hosted working demo | Prepared | Vercel project and Render Blueprint are ready; paid persistent backend approval remains |

## 1. Learning path and skill tree

| Requirement | Status | Evidence |
| --- | --- | --- |
| Visual units and skills with lock progression | Complete | `features/learn/components/learning-path` |
| Completed, available, and locked states | Complete | `skill-node.tsx`, backend learning service |
| Progress rings and crowns | Complete | `skill-node.tsx`, `skill-details.tsx` |
| Streak, XP, hearts, and gems top bar | Complete | shared `components/app-shell/stats-bar.tsx` |

The backend calculates skill availability from prerequisites. The frontend
renders the returned state rather than reimplementing progression rules.

## 2. Lesson player

| Requirement | Status | Evidence |
| --- | --- | --- |
| Multiple choice | Complete | `multiple-choice-exercise.tsx` |
| Translate with word bank | Complete | `word-bank-exercise.tsx` |
| Match pairs | Complete | `match-pairs-exercise.tsx` |
| Fill in the blank | Complete | `text-answer-exercise.tsx` using the fill-blank contract |
| Type the answer | Complete | `text-answer-exercise.tsx` using the typed-answer contract |
| Immediate correct/incorrect feedback bar | Complete | `lesson-action-bar.tsx`, answer mutation |
| Lesson progress bar | Complete | `lesson-header.tsx` |
| Heart loss and failure handling | Complete | backend attempt service, `out-of-hearts.tsx` |
| XP and skill progress on completion | Complete | transactional lesson progression service |

Answers are evaluated only by FastAPI. Public lesson payloads do not include
correct answers, preventing the browser from becoming the authority.

## 3. Gamification and persistent progress

| Requirement | Status | Evidence |
| --- | --- | --- |
| Date-testable streak counter | Complete | `services/lesson_progression.py`, backend attempt tests |
| XP totals | Complete | user and daily activity records, shared stats bar |
| Simple leaderboard | Complete | `/api/v1/leaderboard`, `/leaderboard` |
| Mocked practice/refill | Complete | `/api/v1/hearts/refill`, out-of-hearts action |
| Daily XP goal | Complete | right rail and Profile goal indicator |
| Per-user XP, streak, hearts, skills | Complete | normalized user/progress/attempt tables |

## 4. Content and learner profile

| Requirement | Status | Evidence |
| --- | --- | --- |
| Database-backed course hierarchy | Complete | content models and versioned initial migration |
| Seeded units, skills, lessons, exercises | Complete | `backend/app/seed/catalog.py` |
| Profile stats | Complete | `/api/v1/profile`, `/profile` |
| Achievements | Complete | achievement models, seed data, profile badge UI |
| Persistent learner progress | Complete | SQLAlchemy transactions and SQLite database |

## 5. Duolingo-style experience

| Requirement | Status | Evidence |
| --- | --- | --- |
| Playful gamified UI and mascot | Complete | LingoTrail visual tokens and original Pip mascot |
| Animated lesson feedback | Complete | Motion-powered exercise and feedback transitions |
| Lesson-complete state | Complete | `lesson-complete.tsx` |
| Out-of-hearts state | Complete | `out-of-hearts.tsx` |
| Toasts | Complete | shared animated coming-soon toast |
| Path progress visuals | Complete | winding SVG trail, skill nodes and rings |
| Settings placeholder | Complete | shared navigation with visible toast feedback |

The product uses an original LingoTrail identity and mascot. It recreates the
requested interaction patterns without copying source code or assets from an
existing Duolingo clone repository.

## Bonus work completed

- Achievement and badge system.
- Functioning leaderboard across seeded users.
- Responsive desktop, tablet, and mobile CSS.
- Simplified real authentication with Argon2id password hashing and signed
  HttpOnly cookies.
- Resumable lesson-attempt lifecycle.
- Recoverable API errors and accessible loading states.

Audio, timed challenges, and dark mode remain optional and are not implemented.

## Validation evidence

- Backend: 41 pytest tests.
- Frontend: 17 Vitest/Testing Library tests.
- Monorepo gate: lint, type checking, tests, and production build in both
  workspaces.
- Desktop browser: login, learning path, all five exercise types, Profile, and
  Leaderboard.
- Browser console during the latest social-page QA: zero errors and warnings.
- Mobile-browser testing intentionally not run; responsive rules remain in code.

## Remaining submission blocker

The repository is public and source documentation is complete. The only missing
assignment deliverable is a hosted working URL. Infrastructure configuration is
ready, and final deployment must include:

1. a persistent production backend and database;
2. production CORS, cookie, and secret configuration;
3. a frontend configured with the public API URL;
4. seeded production content and the documented demo learner;
5. a final hosted login and lesson-completion smoke test.
