import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/providers/query-provider";
import { MatchPairsExercise } from "./components/exercises/match-pairs-exercise";
import { TextAnswerExercise } from "./components/exercises/text-answer-exercise";
import { WordBankExercise } from "./components/exercises/word-bank-exercise";
import { LessonPage } from "./lesson-page";
import type { LessonResponse } from "./lesson.types";

const lesson: LessonResponse = {
  id: 2,
  skill_id: 1,
  skill_title: "Basics",
  title: "Basics 2",
  position: 2,
  xp_reward: 10,
  exercise_count: 2,
  exercises: [
    {
      id: 101,
      exercise_type: "multiple_choice",
      instruction: "Choose the correct translation",
      prompt: "The girl",
      position: 1,
      options: [
        {
          id: 1001,
          text: "La niña",
          value: "la niña",
          position: 1,
          match_side: null,
        },
        {
          id: 1002,
          text: "El niño",
          value: "el niño",
          position: 2,
          match_side: null,
        },
      ],
    },
    {
      id: 102,
      exercise_type: "word_bank",
      instruction: "Build the sentence",
      prompt: "He is a man",
      position: 2,
      options: [
        {
          id: 1101,
          text: "Él",
          value: "él",
          position: 1,
          match_side: null,
        },
        {
          id: 1102,
          text: "es",
          value: "es",
          position: 2,
          match_side: null,
        },
        {
          id: 1103,
          text: "un",
          value: "un",
          position: 3,
          match_side: null,
        },
        {
          id: 1104,
          text: "hombre",
          value: "hombre",
          position: 4,
          match_side: null,
        },
      ],
    },
  ],
};

const startAttempt = {
  id: 77,
  lesson_id: 2,
  status: "in_progress",
  hearts_remaining: 5,
  answered_count: 0,
  exercise_count: 2,
  current_exercise_id: 101,
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function renderLesson() {
  return render(
    <QueryProvider>
      <LessonPage lessonId={2} />
    </QueryProvider>,
  );
}

describe("LessonPage", () => {
  it("submits an answer, shows feedback, and advances exercises", async () => {
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      if (input.endsWith("/api/v1/lessons/2") && init?.method === "GET") {
        return jsonResponse(lesson);
      }
      if (input.endsWith("/api/v1/lessons/2/attempts")) {
        return jsonResponse(startAttempt);
      }
      if (input.endsWith("/api/v1/attempts/77/answers")) {
        return jsonResponse({
          attempt_id: 77,
          exercise_id: 101,
          is_correct: true,
          feedback: "Excellent!",
          correct_answer: null,
          explanation: "Niña means girl.",
          status: "in_progress",
          hearts_remaining: 5,
          answered_count: 1,
          exercise_count: 2,
          next_exercise_id: 102,
          xp_earned: 0,
          unlocked_achievements: [],
          learner: {
            hearts: 5,
            max_hearts: 5,
            gems: 500,
            total_xp: 10,
            current_streak: 1,
            daily_goal_xp: 20,
            today_xp: 10,
          },
        });
      }
      throw new Error(`Unexpected request: ${input}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    renderLesson();

    fireEvent.click(
      await screen.findByRole("button", { name: /La niña/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Check" }));

    expect(await screen.findByText("Excellent!")).toBeInTheDocument();
    expect(screen.getByText("Niña means girl.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      await screen.findByRole("heading", { name: "He is a man" }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/attempts/77/answers",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          exercise_id: 101,
          answer: { value: "la niña" },
        }),
      }),
    );
  });

  it("shows wrong-answer guidance and updates hearts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string) => {
        if (input.endsWith("/api/v1/lessons/2")) {
          return jsonResponse(lesson);
        }
        if (input.endsWith("/api/v1/lessons/2/attempts")) {
          return jsonResponse(startAttempt);
        }
        return jsonResponse({
          attempt_id: 77,
          exercise_id: 101,
          is_correct: false,
          feedback: "Not quite.",
          correct_answer: "la niña",
          explanation: "Niña means girl.",
          status: "in_progress",
          hearts_remaining: 4,
          answered_count: 1,
          exercise_count: 2,
          next_exercise_id: 102,
          xp_earned: 0,
          unlocked_achievements: [],
          learner: {
            hearts: 4,
            max_hearts: 5,
            gems: 500,
            total_xp: 10,
            current_streak: 1,
            daily_goal_xp: 20,
            today_xp: 10,
          },
        });
      }),
    );
    renderLesson();

    fireEvent.click(
      await screen.findByRole("button", { name: /El niño/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Check" }));

    expect(await screen.findByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByText("Correct answer: la niña")).toBeInTheDocument();
    expect(screen.getByLabelText("4 hearts remaining")).toBeInTheDocument();
  });

  it("shows the celebration after the final answer", async () => {
    const singleExerciseLesson = {
      ...lesson,
      exercise_count: 1,
      exercises: [lesson.exercises[0]],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string) => {
        if (input.endsWith("/api/v1/lessons/2")) {
          return jsonResponse(singleExerciseLesson);
        }
        if (input.endsWith("/api/v1/lessons/2/attempts")) {
          return jsonResponse({
            ...startAttempt,
            exercise_count: 1,
          });
        }
        return jsonResponse({
          attempt_id: 77,
          exercise_id: 101,
          is_correct: true,
          feedback: "Excellent!",
          correct_answer: null,
          explanation: "Niña means girl.",
          status: "completed",
          hearts_remaining: 5,
          answered_count: 1,
          exercise_count: 1,
          next_exercise_id: null,
          xp_earned: 10,
          unlocked_achievements: [
            {
              code: "first-step",
              title: "First Step",
              description: "Complete your first lesson.",
              icon: "footprints",
              xp_reward: 5,
            },
          ],
          learner: {
            hearts: 5,
            max_hearts: 5,
            gems: 500,
            total_xp: 20,
            current_streak: 2,
            daily_goal_xp: 20,
            today_xp: 20,
          },
        });
      }),
    );
    renderLesson();

    fireEvent.click(
      await screen.findByRole("button", { name: /La niña/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "View results" }),
    );

    expect(
      screen.getByRole("heading", { name: "Lesson complete!" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Lesson complete!" }),
    ).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("+10")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Achievement unlocked!" }),
    ).toBeInTheDocument();
    expect(screen.getByText("First Step")).toBeInTheDocument();
    expect(screen.getByText("+5 bonus XP")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /continue on the path/i }),
    ).toHaveAttribute("href", "/");
  });

  it("refills hearts and starts a fresh attempt", async () => {
    let startCount = 0;
    const fetchMock = vi.fn(async (input: string) => {
      if (input.endsWith("/api/v1/lessons/2")) {
        return jsonResponse(lesson);
      }
      if (input.endsWith("/api/v1/hearts/refill")) {
        return jsonResponse({
          message: "Hearts refilled.",
          learner: {
            hearts: 5,
            max_hearts: 5,
            gems: 500,
            total_xp: 10,
            current_streak: 1,
            daily_goal_xp: 20,
            today_xp: 10,
          },
        });
      }
      if (input.endsWith("/api/v1/lessons/2/attempts")) {
        startCount += 1;
        return startCount === 1
          ? jsonResponse(
              { detail: "Refill your hearts before starting another lesson." },
              409,
            )
          : jsonResponse(startAttempt);
      }
      throw new Error(`Unexpected request: ${input}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    renderLesson();

    expect(
      await screen.findByRole("heading", { name: "You're out of hearts" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "You're out of hearts" }),
    ).toHaveAttribute("aria-modal", "true");
    fireEvent.click(
      screen.getByRole("button", { name: /refill hearts and retry/i }),
    );

    expect(
      await screen.findByRole("heading", { name: "The girl" }),
    ).toBeInTheDocument();
    expect(startCount).toBe(2);
  });
});

describe("MatchPairsExercise", () => {
  it("emits pairs only after every option is matched", () => {
    const onChange = vi.fn();
    render(
      <MatchPairsExercise
        disabled={false}
        exercise={{
          id: 103,
          exercise_type: "match_pairs",
          instruction: "Match the pairs",
          prompt: "Select matching words",
          position: 3,
          options: [
            {
              id: 1,
              text: "girl",
              value: "girl",
              position: 1,
              match_side: "left",
            },
            {
              id: 2,
              text: "niña",
              value: "niña",
              position: 2,
              match_side: "right",
            },
            {
              id: 3,
              text: "boy",
              value: "boy",
              position: 3,
              match_side: "left",
            },
            {
              id: 4,
              text: "niño",
              value: "niño",
              position: 4,
              match_side: "right",
            },
          ],
        }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "girl" }));
    fireEvent.click(screen.getByRole("button", { name: "niña" }));
    expect(onChange).toHaveBeenLastCalledWith(null);

    fireEvent.click(screen.getByRole("button", { name: "boy" }));
    fireEvent.click(screen.getByRole("button", { name: "niño" }));
    expect(onChange).toHaveBeenLastCalledWith({
      pairs: [
        { left_option_id: 1, right_option_id: 2 },
        { left_option_id: 3, right_option_id: 4 },
      ],
    });
  });
});

describe("WordBankExercise", () => {
  it("preserves the learner's selected token order", () => {
    const onChange = vi.fn();
    render(
      <WordBankExercise
        disabled={false}
        exercise={lesson.exercises[1]}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Él" }));
    fireEvent.click(screen.getByRole("button", { name: "es" }));
    fireEvent.click(screen.getByRole("button", { name: "un" }));
    fireEvent.click(screen.getByRole("button", { name: "hombre" }));

    expect(onChange).toHaveBeenLastCalledWith({
      tokens: ["él", "es", "un", "hombre"],
    });
  });
});

describe("TextAnswerExercise", () => {
  it("creates the same typed payload for fill-blank and free-text answers", () => {
    const onChange = vi.fn();
    render(
      <TextAnswerExercise
        disabled={false}
        exercise={{
          id: 104,
          exercise_type: "fill_blank",
          instruction: "Fill in the blank",
          prompt: "Ella ___ una niña.",
          position: 4,
          options: [],
        }}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Missing word"), {
      target: { value: "es" },
    });

    expect(screen.getByText("Ella ___ una niña.")).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith({ text: "es" });
  });
});
