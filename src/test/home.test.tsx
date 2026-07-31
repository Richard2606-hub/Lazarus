import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, getSystemStatus: vi.fn() };
});

describe("Home", () => {
  beforeEach(() => {
    vi.mocked(api.getSystemStatus).mockResolvedValue({
      mode: "prototype",
      corpus_size: 3,
      searchable_records: 3,
      verified_records: 2,
      pending_review: 1,
      completed_reviews: 4,
      coverage_note: "Bounded demonstration corpus only.",
    });
  });

  it("presents all proposal modules and live coverage", async () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("forgotten attempts");
    expect(screen.getByRole("link", { name: /check an approach/i })).toHaveAttribute("href", "/graveyard");
    expect(screen.getByText("Citation Necromancer")).toBeInTheDocument();
    expect(screen.getByText("Verification Exchange")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Bounded demonstration corpus only.")).toBeInTheDocument());
    const reviewsMetric = screen.getByText("Reviews logged").parentElement;
    expect(reviewsMetric).not.toBeNull();
    expect(within(reviewsMetric as HTMLElement).getByText("4")).toBeInTheDocument();
  });
});
