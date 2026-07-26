import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./theme-toggle";

function matchMedia(matches: boolean): MediaQueryList {
  return {
    matches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = "light";
    vi.stubGlobal("matchMedia", vi.fn(() => matchMedia(false)));
  });

  it("persists the selected theme and synchronizes mounted controls", () => {
    render(
      <>
        <ThemeToggle showLabel />
        <ThemeToggle />
      </>,
    );

    const toggles = screen.getAllByRole("button", {
      name: "Toggle color theme",
    });

    fireEvent.click(toggles[0]);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(window.localStorage.getItem("lingotrail-theme")).toBe("dark");

    fireEvent.click(toggles[1]);

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("lingotrail-theme")).toBe("light");
  });
});
