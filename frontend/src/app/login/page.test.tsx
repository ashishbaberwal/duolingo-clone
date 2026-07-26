import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthPage } from "@/features/auth";
import { QueryProvider } from "@/providers/query-provider";

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

function renderPage(
  props: { accountCreated?: boolean; initialUsername?: string } = {},
) {
  return render(
    <QueryProvider>
      <AuthPage {...props} />
    </QueryProvider>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    replace.mockClear();
    refresh.mockClear();
  });

  it("starts empty and links new learners to account creation", () => {
    renderPage();

    expect(screen.getByLabelText("Username")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
    expect(
      screen.getByRole("link", { name: "Create your account" }),
    ).toHaveAttribute("href", "/signup");
  });

  it("shows signup confirmation and prefills only the username", () => {
    renderPage({ accountCreated: true, initialUsername: "new-learner" });

    expect(screen.getByRole("status")).toHaveTextContent("Account created");
    expect(screen.getByLabelText("Username")).toHaveValue("new-learner");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("submits credentials and opens the learning path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: 5,
        username: "new-learner",
        display_name: "New Learner",
        avatar_key: "fox",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "new-learner" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "StrongPass1" },
    });
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
          username: "new-learner",
          password: "StrongPass1",
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

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "new-learner" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "incorrect" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue learning" }));

    expect(
      await screen.findByText("Invalid username or password."),
    ).toBeInTheDocument();
  });
});
