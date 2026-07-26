# Profile and leaderboard frontend

The Profile and Leaderboard pages turn the existing social-progress APIs into
two authenticated frontend routes:

```text
/profile       -> GET /api/v1/profile
/leaderboard   -> GET /api/v1/profile + GET /api/v1/leaderboard
```

## Component boundaries

```text
app/profile/page.tsx
└── AuthGuard
    └── ProfilePage
        └── AppShell
            ├── ProfileHero
            ├── ProgressOverview
            └── AchievementGrid

app/leaderboard/page.tsx
└── AuthGuard
    └── LeaderboardPage
        └── AppShell
            ├── LeaderboardHero
            ├── Podium
            └── RankingList
```

Routes compose authentication and feature pages, feature pages own data-query
states, and smaller components render one visual responsibility. This prevents
route files from becoming large and keeps server communication out of
presentational components.

The shared `components/app-shell` folder owns the layout, stats bar, sidebar,
right rail, and route-aware navigation. It is intentionally outside
`features/learn`: Profile and Leaderboard must not import another feature's
private UI. Reusable learner avatars and loading/error states follow the same
application-level rule.

## Data ownership

TanStack Query owns remote server state:

- `useProfile()` caches learner identity, stats, progress counts, and badges;
- `useLeaderboard()` caches ranked entries and the current learner's rank;
- stable query keys allow login/logout to invalidate or clear related data;
- a 30-second stale time avoids duplicate requests during nearby navigation;
- retry is limited to one attempt so genuine errors reach a recoverable UI.

The leaderboard also reads the profile because `AppShell` needs live hearts,
gems, streak, and XP. Those values do not belong in the leaderboard response,
so the backend contracts remain cohesive. Both queries begin in the same render
and run concurrently.

React components calculate presentation-only values such as the capped daily
goal percentage and podium display order. Ranking itself remains a backend
responsibility, which gives every client the same authoritative order.

## Error and edge-case handling

- Authentication is checked before feature queries mount.
- Loading and failure states have accessible labels and a retry action.
- Daily goal progress is capped at 100 percent for the circular chart.
- One-day streak text uses singular grammar.
- Unknown avatar and achievement keys fall back safely.
- Empty achievement lists render a useful next action.
- The podium tolerates fewer than three returned entries.
- The current learner row is identified by the server-provided boolean rather
  than comparing display names.

## Interview explanation

**Why TanStack Query instead of fetching in `useEffect`?** It models server
state directly: caching, request deduplication, abort signals, retries, loading
states, and invalidation are declarative. A hand-written effect would recreate
those concerns and be easier to get wrong.

**Why not put all data in one dashboard endpoint?** The profile and leaderboard
change for different reasons and have different consumers. Separate cohesive
contracts are easier to cache, test, and evolve. The frontend can compose them
in parallel when one screen needs both.

**Why use CSS Modules?** Component-local class names prevent collisions while
keeping the styling explicit. Shared colors remain CSS custom properties in
`globals.css`, so the visual system is consistent without a large global
stylesheet.

**Why render server-provided ranks?** Ranking rules belong to the backend, where
all clients see the same result. Re-ranking on the frontend could disagree when
tie-breaking or pagination is added.

## Tests

Route-level Vitest tests mock requests by URL and verify:

- authentication completes before protected content renders;
- profile identity, progress, goal, and achievement values come from the API;
- podium and standings use backend ranking data;
- the learner's row is marked `YOU`;
- the correct desktop navigation link has `aria-current="page"`.

Desktop Playwright QA covers the real login and navigation flow and checks the
browser console. Mobile-browser testing is deliberately excluded from this
assignment run at the learner's request, while responsive CSS remains present.
