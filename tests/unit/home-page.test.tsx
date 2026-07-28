import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "@/app/page";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("Home", () => {
  it("describes the read-only foundation", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "FantasyMaster" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/integrations remain read-only/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /login placeholder/i }),
    ).toHaveAttribute("href", "/login");
  });
});
