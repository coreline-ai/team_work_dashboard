import { expect, test } from "@playwright/test"
import { MEMBER_STORAGE_STATE_PATH } from "./support/e2e-data"

test.describe("Team Members Execution View", () => {
  test("guest can view summary only and cannot access execution API", async ({ page, request }) => {
    const response = await page.goto("/team-members")
    expect(response).not.toBeNull()
    expect(response!.status()).toBeLessThan(400)

    await expect(page.getByTestId("team-public-summary")).toBeVisible()
    await expect(page.getByTestId("team-execution-section")).toHaveCount(0)

    const apiRes = await request.get("/api/team-members/execution")
    expect(apiRes.status()).toBe(401)
  })

  test.describe("authenticated member", () => {
    test.use({ storageState: MEMBER_STORAGE_STATE_PATH })

    test("can see project-based in-progress execution details and sort toggles", async ({ page }) => {
      await page.goto("/team-members")

      await expect(page.getByTestId("team-public-summary")).toBeVisible()
      await expect(page.getByTestId("team-execution-section")).toBeVisible()

      await expect(page.getByTestId("team-exec-sort-due-soon")).toBeVisible()
      await expect(page.getByTestId("team-exec-sort-progress")).toBeVisible()
      await expect(page.getByTestId("team-exec-sort-due-soon")).toHaveAttribute("aria-pressed", "true")

      const firstToggle = page.locator('[data-testid^="team-exec-member-toggle-"]').first()
      await expect(firstToggle).toBeVisible()
      await firstToggle.click()

      await expect(page.locator('a[href*="/tasks?projectId="]').first()).toBeVisible()
      await expect(page.getByTestId("team-execution-section").locator("tbody tr").first()).toBeVisible()

      await page.getByTestId("team-exec-sort-progress").click()
      await expect(page.getByTestId("team-exec-sort-progress")).toHaveAttribute("aria-pressed", "true")
      await expect(page.getByTestId("team-exec-sort-due-soon")).toHaveAttribute("aria-pressed", "false")

      await page.getByTestId("team-exec-sort-due-soon").click()
      await expect(page.getByTestId("team-exec-sort-due-soon")).toHaveAttribute("aria-pressed", "true")
    })
  })
})
