# Frontend learning path

The home page is a responsive, API-driven learning path. It presents the
learner's course structure, progress, currency, hearts, streak, daily goal, and
next available lesson.

## Runtime data flow

```text
FastAPI GET /api/v1/path
            |
            v
typed fetch client -> TanStack Query cache -> LearnPage
                                                |
                         AppShell ---------------+---- LearningPath
                         |                            |
                  navigation/stats              units and skill nodes
```

`NEXT_PUBLIC_API_URL` controls the backend origin and defaults to
`http://localhost:8000`. Copy `frontend/.env.example` to
`frontend/.env.local` only when a different local backend URL is needed.

## Component responsibilities

- `LearnPage` owns the remote-data states: loading, failure, and success.
- `AppShell` owns responsive navigation, learner stats, and the supporting
  desktop rail.
- `LearningPath` maps API units and skills to the winding course trail.
- `SkillButton` turns backend `completed`, `available`, and `locked` states into
  distinct controls and opens one detail card at a time.
- `PipMascot` is an original inline SVG component. Keeping it in code makes its
  colors responsive to the design system without adding an image request.

The temporary `/lesson/[lessonId]` route deliberately prevents a valid lesson
link from ending at a 404 while the lesson-player checkpoint is still pending.
It will be replaced by the interactive exercise session.

## State ownership

Remote server state belongs to TanStack Query. It provides request lifecycle
state, caching, retries, and refetching. The currently selected skill is local
UI state because it is temporary, belongs to one component tree, and does not
need persistence.

Zustand is intentionally not installed yet. Introducing a global store for one
selected identifier would add another state model without solving a real
problem. The lesson player may justify a dedicated client store when it needs a
multi-step session, optimistic answer feedback, and recovery.

## Responsive behavior

- Desktop: persistent left navigation, centered learning path, and right-side
  progress cards.
- Tablet: compact icon navigation and a narrower supporting rail.
- Mobile: content-first layout, compact top stats, fixed bottom navigation, and
  a bottom-sheet-style skill detail card.

The path's skill state is never communicated by color alone. Icons, text labels,
disabled controls, and accessible names reinforce the visual treatment.

## Testing

The frontend tests mock the HTTP boundary, not component internals. They verify:

1. API progress appears in the page.
2. An available skill links to the next unfinished lesson.
3. A locked skill cannot be started.
4. API failure produces a clear retry state.

Run them with:

```bash
pnpm --filter @duo/frontend test
```
