# ADR 004: Frontend state and interaction architecture

- Status: Accepted
- Date: 2026-07-26
- Authentication note: ADR 005 extends this design with a current-user query,
  an authentication guard, and explicit login/logout mutations.
- Lesson note: ADR 006 extends it with typed attempt mutations and a local
  lesson-session controller.

## Context

The learning path needs learner-specific backend data, responsive navigation,
short-lived skill selection, animated feedback, and explicit loading and error
states. The 20-hour assignment timeline rewards a polished core loop more than
an oversized frontend abstraction layer.

## Decision

Use:

- Next.js App Router and React for routing and component composition.
- TypeScript interfaces mirroring the public FastAPI response contract.
- TanStack Query for server-state fetching, caching, retrying, and refetching.
- Local React state for the currently open skill card.
- CSS Modules and global design tokens for scoped, responsive styling.
- Motion for purposeful entry, selection, and feedback animation.
- Lucide React for consistent accessible interface icons.
- A bundled variable Nunito font to avoid a runtime font-network dependency.

Keep the first learning-path request client-side. This makes loading, retry, and
learner-session refresh behavior explicit. ADR 005 later places the request
behind a verified current-user query.

Pin production builds to Next.js's webpack compiler for this assignment. The
development server still uses Turbopack, while webpack currently gives the
repository's combined Turbo quality gate a deterministic, non-interactive
production build.

Generate Next.js route types during `check-types`, and make the frontend build
depend on that task in Turbo. Both commands read or replace `.next/types`, so
running them concurrently creates a race even when each command passes alone.

## Why TanStack Query instead of raw `useEffect`

A manual effect would require separately implementing loading state, error
state, cancellation, retry, caching, stale-data policy, and refetching.
TanStack Query provides those server-state concerns behind one query hook.

It also separates two different categories of state:

- server state, which is asynchronous and may become stale;
- interface state, which is immediate and local to the current screen.

## Why CSS Modules

The learning path uses substantial custom geometry, breakpoints, and visual
states. CSS Modules keep class names scoped while preserving normal CSS for
pseudo-elements, custom properties, and media queries.

Utility classes could express the same result, but the long dynamic class lists
would make the path geometry harder to explain and maintain. Tailwind remains
available for later isolated use; it is not required merely because it is
installed.

## Why no global client store yet

Selected-skill state belongs to the learning path and lesson draft/feedback
state belongs to one lesson controller. Persistent resume data belongs to the
backend attempt. A global store would increase indirection and duplicate server
state without a second client-side owner.

## Why not copy Duolingo exactly

The assignment asks for a clone of the product behavior, not its protected
brand assets. LingoTrail uses an original name, original Pip mascot, different
copy, and its own supporting card treatments while retaining the familiar
learning-path interaction model.

## Alternatives considered

### Server-render the path only

Rejected for this checkpoint because the interface must demonstrate retry and
refresh behavior. A server component can be introduced later if request-bound
identity is forwarded from the authenticated session.

### Redux or Zustand for all state

Rejected because the current state graph is small. State management should be
introduced in response to coordination needs, not as a default layer.

### Fetch directly inside visual components

Rejected because it would couple HTTP lifecycle concerns to path rendering and
make loading, errors, and component tests harder to isolate.

### Remote Google Fonts

Rejected because production builds and local demos should not depend on a font
CDN. The font package is resolved at install time and bundled with the app.

## Consequences

- The UI has a single typed query boundary and explicit async states.
- Visual components remain reusable with fixture data in tests.
- The page hydrates on the client before showing course content.
- A future authenticated server-rendering pass may move query prefetching to the
  server without changing the visual components.
- Global client state remains unnecessary until unrelated routes need to edit
  the same client-owned state.
