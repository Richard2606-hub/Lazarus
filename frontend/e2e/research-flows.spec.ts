import { expect, Page, test } from "@playwright/test";

const verifiedRecord = {
  id: 1,
  title: "Linear probing failed to generalize",
  authors: "Test Author",
  abstract: "Linear classifiers failed on external sensor data.",
  method_description: "Linear probing of frozen sensor representations.",
  source_type: "preprint_withdrawal",
  source_url: "https://example.com/verified",
  stated_reason: "The method did not generalize.",
  failure_cause_tag: "Lack of Generalization",
  classification_confidence: 0.9,
  system_verified: true,
};

const pendingRecord = {
  ...verifiedRecord,
  id: 2,
  title: "Ambiguous sparse event detector",
  source_url: "https://example.com/pending",
  stated_reason: "Withdrawn without a stated reason.",
  failure_cause_tag: "Ambiguous / Unknown",
  classification_confidence: 0.4,
  system_verified: false,
};

async function mockApi(page: Page) {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    let body: unknown = {};
    if (url.pathname === "/api/status") {
      body = {
        mode: "prototype",
        corpus_size: 2,
        searchable_records: 2,
        verified_records: 1,
        pending_review: 1,
        completed_reviews: 0,
        coverage_note: "Bounded demonstration corpus only.",
      };
    } else if (url.pathname === "/api/graveyard/query") {
      body = [{ record: verifiedRecord, match_confidence: 0.84 }];
    } else if (url.pathname === "/api/necromancer/query") {
      body = [{
        record: pendingRecord,
        match_confidence: 0.73,
        explanation: "Both methods detect sparse events under weak supervision.",
      }];
    } else if (url.pathname === "/api/verification/queue") {
      body = [pendingRecord];
    } else if (url.pathname === "/api/verification/history") {
      body = [];
    } else if (url.pathname === "/api/verification/2/decision") {
      body = { id: 2, decision: "confirm", message: "Record confirmed and added to the verified pool." };
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("researcher can understand coverage and search a failure record", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("forgotten attempts");
  await expect(page.getByText("Bounded demonstration corpus only.")).toBeVisible();
  await page.getByRole("link", { name: "Check an approach" }).click();
  await expect(page).toHaveURL(/\/graveyard$/);
  const query = page.getByLabel("Planned research approach");
  await page.getByRole("button", { name: "Use an example" }).click();
  await expect(query).toHaveValue(/linear probing/i);
  await page.getByRole("button", { name: "Search failure records" }).click();
  await expect(page.getByText(verifiedRecord.title)).toBeVisible();
  await expect(page.getByText(/System verified/)).toBeVisible();
  await page.getByText("View method and abstract context").click();
  await expect(page.getByText(verifiedRecord.method_description)).toBeVisible();
});

test("researcher sees pending status on a cross-domain lead", async ({ page }) => {
  await page.goto("/necromancer");
  const query = page.getByLabel("Stuck research problem");
  await page.getByRole("button", { name: "Use an example" }).click();
  await expect(query).toHaveValue(/distribution drift/i);
  await page.getByRole("button", { name: "Find analogous methods" }).click();
  await expect(page.getByText(pendingRecord.title)).toBeVisible();
  await expect(page.getByText(/Pending human review/)).toBeVisible();
  await expect(page.getByText(/Both methods detect sparse events/)).toBeVisible();
});

test("reviewer must explain and can confirm a queued record", async ({ page }) => {
  await page.goto("/verification");
  await expect(page.getByText(pendingRecord.title)).toBeVisible();
  const confirm = page.getByRole("button", { name: "Confirm classification" });
  await expect(confirm).toBeDisabled();
  await page.getByLabel("Evidence-based rationale").fill(
    "The source explicitly supports the proposed classification.",
  );
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.getByText(/Record confirmed/)).toBeVisible();
  await expect(page.getByText("The reviewer queue is clear.")).toBeVisible();
  await expect(page.getByText("The source explicitly supports the proposed classification.")).toBeVisible();
});
