import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/providers/query-provider";
import LoginPage from "./page";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

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
      <LoginPage />
    </QueryProvider>,
  );
}

describe("LoginPage", () => {
  it("shows the documented local credentials", () => {
    renderPage();

    expect(screen.getByLabelText("Username")).toHaveValue("learner");
    expect(screen.getByLabelText("Password")).toHaveValue("LingoTrail@123");
    expect(screen.getByText("DEMO CREDENTIALS")).toBeInTheDocument();
  });

  it("submits credentials and opens the learning path", async () => {
    replace.mockClear();
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: 1,
        username: "learner",
        display_name: "Ava",
        avatar_key: "fox",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Continue learning" }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/");
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/auth/login",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          username: "learner",
          password: "LingoTrail@123",
        }),
      }),
    );
  });

  it("shows the backend's generic credential error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ detail: "Invalid username or password." }, 401),
        ),
    );
    renderPage();

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "incorrect" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue learning" }));

    expect(
      await screen.findByText("Invalid username or password."),
    ).toBeInTheDocument();
  });
});
