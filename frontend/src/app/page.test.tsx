import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("shows that the monorepo foundation is ready", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "LingoTrail is taking shape." }),
    ).toBeInTheDocument();
  });
});
