import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/providers/query-provider";
import LeaderboardRoute from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

const authenticatedUser = {
  id: 1,
  username: "learner",
  display_name: "Ava",
  avatar_key: "fox",
};

const profile = {
  username: "learner",
  display_name: "Ava",
  avatar_key: "fox",
  stats: {
    hearts: 5,
    max_hearts: 5,
    gems: 500,
    total_xp: 20,
    current_streak: 2,
    daily_goal_xp: 20,
    today_xp: 10,
  },
  longest_streak: 2,
  skills_completed: 0,
  lessons_completed: 2,
  achievements: [],
};

const leaderboard = {
  current_learner_rank: 5,
  entries: [
    ["maya", "Maya", "owl", 780],
    ["zara", "Zara", "bear", 650],
    ["leo", "Leo", "lion", 420],
    ["noah", "Noah", "panda", 310],
    ["learner", "Ava", "fox", 20],
  ].map(([username, displayName, avatarKey, totalXp], index) => ({
    rank: index + 1,
    username,
    display_name: displayName,
    avatar_key: avatarKey,
    total_xp: totalXp,
    is_current_learner: username === "learner",
  })),
};

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("LeaderboardRoute", () => {
  it("renders the podium, standings, and current learner rank", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: string) => {
        if (input.endsWith("/api/v1/auth/me")) {
          return Promise.resolve(jsonResponse(authenticatedUser));
        }
        if (input.endsWith("/api/v1/profile")) {
          return Promise.resolve(jsonResponse(profile));
        }
        return Promise.resolve(jsonResponse(leaderboard));
      }),
    );

    render(
      <QueryProvider>
        <LeaderboardRoute />
      </QueryProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Weekly leaderboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("#5")).toBeInTheDocument();
    expect(screen.getByText("780 XP")).toBeInTheDocument();
    expect(screen.getByText("@learner")).toBeInTheDocument();
    expect(screen.getByText("YOU")).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("navigation", { name: "Primary navigation" }),
      ).getByRole("link", { name: /leaderboards/i }),
    ).toHaveAttribute("aria-current", "page");
  });
});
