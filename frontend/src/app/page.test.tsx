import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/providers/query-provider";
import HomePage from "./page";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

const authenticatedUser = {
  id: 1,
  username: "learner",
  display_name: "Ava",
  avatar_key: "fox",
};

const learningPath = {
  course: {
    id: 1,
    code: "es",
    title: "Spanish",
    source_language: "English",
    target_language: "Spanish",
  },
  learner: {
    hearts: 4,
    max_hearts: 5,
    gems: 240,
    total_xp: 780,
    current_streak: 7,
    daily_goal_xp: 20,
    today_xp: 12,
  },
  units: [
    {
      id: 1,
      title: "First Steps",
      description: "Meet the essentials.",
      position: 1,
      skills: [
        {
          id: 1,
          title: "Basics",
          description: "Build your first Spanish sentences.",
          icon: "book-open",
          position: 1,
          state: "available",
          lessons_completed: 1,
          lesson_count: 2,
          crowns: 1,
          next_lesson_id: 2,
          prerequisite_ids: [],
          lessons: [
            {
              id: 1,
              title: "First words",
              position: 1,
              is_completed: true,
            },
            {
              id: 2,
              title: "Useful phrases",
              position: 2,
              is_completed: false,
            },
          ],
        },
        {
          id: 2,
          title: "Greetings",
          description: "Say hello and introduce yourself.",
          icon: "hand",
          position: 2,
          state: "locked",
          lessons_completed: 0,
          lesson_count: 2,
          crowns: 0,
          next_lesson_id: null,
          prerequisite_ids: [1],
          lessons: [],
        },
      ],
    },
  ],
} as const;

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function renderPage() {
  return render(
    <QueryProvider>
      <HomePage />
    </QueryProvider>,
  );
}

describe("HomePage", () => {
  it("renders learner progress from the path API", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(authenticatedUser))
        .mockResolvedValue(jsonResponse(learningPath)),
    );
    renderPage();

    expect(
      screen.getByLabelText("Checking your session"),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", {
        name: "Keep your momentum moving",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "First Steps" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Day streak: 7")).toBeInTheDocument();
    expect(screen.getByLabelText("Total XP: 780")).toBeInTheDocument();
    expect(screen.getByLabelText("Hearts: 4/5")).toBeInTheDocument();
  });

  it("opens skill details and links to the next unfinished lesson", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(authenticatedUser))
        .mockResolvedValue(jsonResponse(learningPath)),
    );
    renderPage();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Basics, available, 1 of 2 lessons",
      }),
    );

    expect(
      screen.getByRole("dialog", { name: "Basics details" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /continue lesson/i })).toHaveAttribute(
      "href",
      "/lesson/2",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Close skill details" }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Greetings, locked, 0 of 2 lessons",
      }),
    );

    expect(
      screen.getByRole("button", { name: /complete prerequisites/i }),
    ).toBeDisabled();
  });

  it(
    "shows a recoverable error when the API is unavailable",
    async () => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValueOnce(jsonResponse(authenticatedUser))
          .mockResolvedValue(
            jsonResponse({ detail: "Course service is unavailable." }, 503),
          ),
      );
      renderPage();

      expect(
        await screen.findByRole(
          "heading",
          { name: "We couldn't load your course." },
          { timeout: 2_500 },
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Course service is unavailable."),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /try again/i }),
      ).toBeInTheDocument();
    },
    4_000,
  );

  it("clears an invalid session and redirects to login", async () => {
    replace.mockClear();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({ detail: "Authentication required." }, 401),
        )
        .mockResolvedValueOnce(
          jsonResponse({ message: "Signed out successfully." }),
        ),
    );
    renderPage();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
  });
});
