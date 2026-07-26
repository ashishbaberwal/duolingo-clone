import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/providers/query-provider";
import CreateAccountPage from "./page";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
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
      <CreateAccountPage />
    </QueryProvider>,
  );
}

function completeForm(passwordConfirmation = "StrongPass1") {
  fireEvent.change(screen.getByLabelText("Display name"), {
    target: { value: "  Trail Explorer  " },
  });
  fireEvent.change(screen.getByLabelText("Username"), {
    target: { value: "Trail.Explorer" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "TRAIL@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "StrongPass1" },
  });
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: passwordConfirmation },
  });
}

describe("SignupPage", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("collects account details and links existing users to login", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Create account" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("stops mismatched passwords before making an API request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderPage();
    completeForm("DifferentPass1");

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Passwords do not match.")).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates a normalized account and sends the learner to login", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: 5,
        username: "trail.explorer",
        display_name: "Trail Explorer",
        email: "trail@example.com",
        avatar_key: "fox",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderPage();
    completeForm();

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        "/login?created=true&username=trail.explorer",
      );
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/auth/register",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          display_name: "Trail Explorer",
          username: "trail.explorer",
          email: "trail@example.com",
          password: "StrongPass1",
        }),
      }),
    );
  });

  it("shows a duplicate username conflict from the backend", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          { detail: "This username is already registered." },
          409,
        ),
      ),
    );
    renderPage();
    completeForm();

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("This username is already registered."),
    ).toBeVisible();
  });
});
