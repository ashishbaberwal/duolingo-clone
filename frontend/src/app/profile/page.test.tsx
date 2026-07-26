import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/providers/query-provider";
import ProfileRoute from "./page";

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
    total_xp: 110,
    current_streak: 3,
    daily_goal_xp: 20,
    today_xp: 10,
  },
  longest_streak: 7,
  skills_completed: 2,
  lessons_completed: 8,
  achievements: [
    {
      code: "first-step",
      title: "First Step",
      description: "Complete your first lesson.",
      icon: "footprints",
      xp_reward: 5,
      unlocked_at: "2026-07-25T10:00:00Z",
    },
  ],
};

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("ProfileRoute", () => {
  it("renders identity, progress, goal, and achievements from the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: string) => {
        const body = input.endsWith("/api/v1/auth/me")
          ? authenticatedUser
          : profile;
        return Promise.resolve(jsonResponse(body));
      }),
    );

    render(
      <QueryProvider>
        <ProfileRoute />
      </QueryProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Ava" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("110")).toHaveLength(2);
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("10 of 20 XP")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "First Step" })).toBeInTheDocument();
    expect(screen.getByText("+5 XP")).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("navigation", { name: "Primary navigation" }),
      ).getByRole("link", { name: /profile/i }),
    ).toHaveAttribute("aria-current", "page");
  });
});
