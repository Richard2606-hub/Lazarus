import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Graveyard from "@/app/graveyard/page";
import * as api from "@/lib/api";
import { verifiedRecord } from "./fixtures";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, queryGraveyard: vi.fn() };
});

describe("Graveyard", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(api.queryGraveyard).mockResolvedValue([
      { record: verifiedRecord, match_confidence: 0.82 },
    ]);
  });

  it("validates a short query before calling the API", async () => {
    const user = userEvent.setup();
    render(<Graveyard />);
    await user.type(screen.getByLabelText("Planned research approach"), "short");
    await user.click(screen.getByRole("button", { name: "Search failure records" }));
    expect(screen.getByRole("alert")).toHaveTextContent("at least 12 characters");
    expect(api.queryGraveyard).not.toHaveBeenCalled();
  });

  it("searches, explains confidence, and exposes source context", async () => {
    const user = userEvent.setup();
    render(<Graveyard />);
    await user.click(screen.getByRole("button", { name: "Use an example" }));
    await user.click(screen.getByRole("button", { name: "Search failure records" }));
    expect(await screen.findByText(verifiedRecord.title)).toBeInTheDocument();
    expect(screen.getByText(/system verified/i)).toBeInTheDocument();
    await user.click(screen.getByText("View method and abstract context"));
    expect(screen.getByText(verifiedRecord.method_description)).toBeInTheDocument();
  });
});
