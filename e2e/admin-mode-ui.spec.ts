import { expect, test } from "@playwright/test"
import { ADMIN_STORAGE_STATE_PATH, MEMBER_STORAGE_STATE_PATH } from "./support/e2e-data"

test.describe("Admin Mode UI Gating", () => {
  test.describe("ADMIN", () => {
    test.use({ storageState: ADMIN_STORAGE_STATE_PATH })

    test("admin controls are hidden by default and shown only when admin mode is ON", async ({ page }) => {
      await page.goto("/projects")

      const toggle = page.getByTestId("admin-mode-toggle")
      await expect(toggle).toBeVisible()
      await expect(toggle).toContainText("관리 모드 OFF")
      await expect(page.getByTestId("projects-admin-panel")).toHaveCount(0)

      await toggle.click()
      await expect(toggle).toContainText("관리 모드 ON")
      await expect(page.getByTestId("projects-admin-panel")).toBeVisible()

      await page.goto("/team-members")
      const teamToggle = page.getByTestId("admin-mode-toggle")
      await expect(teamToggle).toBeVisible()
      await teamToggle.click()
      await expect(page.getByTestId("team-admin-create-panel")).toBeVisible()
      await expect(page.getByTestId("team-admin-manage-panel")).toBeVisible()
    })
  })

  test.describe("MEMBER", () => {
    test.use({ storageState: MEMBER_STORAGE_STATE_PATH })

    test("member cannot see admin toggle or admin panels", async ({ page }) => {
      await page.goto("/projects")
      await expect(page.getByTestId("admin-mode-toggle")).toHaveCount(0)
      await expect(page.getByTestId("projects-admin-panel")).toHaveCount(0)

      await page.goto("/team-members")
      await expect(page.getByTestId("team-admin-create-panel")).toHaveCount(0)
      await expect(page.getByTestId("team-admin-manage-panel")).toHaveCount(0)
    })
  })

  test("guest cannot see admin controls", async ({ page }) => {
    await page.goto("/projects")
    await expect(page.getByTestId("admin-mode-toggle")).toHaveCount(0)
    await expect(page.getByTestId("projects-admin-panel")).toHaveCount(0)
  })
})
