import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Verification from "@/app/verification/page";
import * as api from "@/lib/api";
import { pendingRecord } from "./fixtures";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getVerificationQueue: vi.fn(),
    getVerificationHistory: vi.fn(),
    decideVerification: vi.fn(),
  };
});

describe("Verification Exchange", () => {
  beforeEach(() => {
    vi.mocked(api.getVerificationQueue).mockResolvedValue([pendingRecord]);
    vi.mocked(api.getVerificationHistory).mockResolvedValue([]);
    vi.mocked(api.decideVerification).mockResolvedValue({
      id: pendingRecord.id,
      decision: "confirm",
      message: "Record confirmed and added to the verified pool.",
    });
  });

  it("requires a rationale and records a reviewer decision", async () => {
    const user = userEvent.setup();
    render(<Verification />);
    expect(await screen.findByText(pendingRecord.title)).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Confirm classification" });
    expect(confirm).toBeDisabled();
    await user.type(
      screen.getByLabelText(/evidence-based rationale/i),
      "The source explicitly supports the proposed classification.",
    );
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    await waitFor(() => expect(api.decideVerification).toHaveBeenCalledWith(
      pendingRecord.id,
      "confirm",
      "The source explicitly supports the proposed classification.",
    ));
    expect(await screen.findByText(/record confirmed/i)).toBeInTheDocument();
    expect(screen.getByText("The reviewer queue is clear.")).toBeInTheDocument();
  });
});
