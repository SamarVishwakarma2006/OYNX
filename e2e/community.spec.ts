import { test, expect } from "@playwright/test";

test("guided builder preserves evidence, saves and opens an honest schematic", async ({
  page,
}) => {
  await page.goto("/build");
  await page.getByLabel("Device name").fill("Library desk fan");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Component name").fill("Guard");
  await page.getByLabel("Purpose", { exact: true }).fill("Covers the blades");
  await page.getByLabel("Evidence status").selectOption("observed");
  await page
    .getByLabel("Evidence note / source reference")
    .fill("Mesh visible around the blades.");
  await page.getByRole("button", { name: "Add component" }).click();
  await page.getByRole("button", { name: /Review 1 components/ }).click();
  await page.getByRole("button", { name: "Save locally" }).click();
  await expect(page.getByRole("status")).toContainText("Saved on this browser");
  await page.reload();
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await page.getByRole("button", { name: "Guard", exact: true }).click();
  await expect(page.locator(".source-note")).toContainText(
    "Evidence: observed",
  );
  await expect(page.locator(".source-note")).toContainText(
    "Mesh visible around the blades.",
  );
});

test("repair outcomes persist and export", async ({ page }) => {
  await page.goto("/impact?product=Library%20desk%20fan");
  await expect(page.getByLabel("Device", { exact: true })).toHaveValue(
    "Library desk fan",
  );
  await page.getByLabel("Problem encountered").fill("Loose external stand");
  await page.getByLabel("Outcome", { exact: true }).selectOption("Repaired");
  await page
    .getByLabel("What changed / how you checked")
    .fill("Stand secured; unit sits level.");
  await page.getByRole("button", { name: "Save outcome" }).click();
  await expect(page.getByRole("status")).toContainText("Outcome saved");
  await page.reload();
  await expect(page.locator(".record-list")).toContainText(
    "Loose external stand",
  );
  await expect(page.locator(".impact-stats section").first()).toContainText(
    "1",
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export records" }).click();
  expect((await download).suggestedFilename()).toBe(
    "inside-repair-outcomes.json",
  );
});

test("automotive page loads the assembled concept model without explosion controls", async ({
  page,
}) => {
  await page.goto("/coming-soon");
  await expect(
    page.getByLabel("Assembled Automotive Concept 3D preview"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Reset view" })).toBeVisible();
  await expect(page.getByLabel("Explosion factor")).toHaveCount(0);
  await expect(
    page.getByText("could not load", { exact: false }),
  ).toHaveCount(0);
});
