import { expect, test } from "@playwright/test"
import { ADMIN_STORAGE_STATE_PATH } from "./support/e2e-data"

test.describe("Header Profile Popover", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE_PATH })

  test("opens from profile area and closes on outside click", async ({ page }) => {
    await page.goto("/")

    const trigger = page.getByTestId("header-profile-trigger")
    await expect(trigger).toBeVisible()
    await trigger.click()

    const popover = page.getByTestId("header-profile-popover")
    await expect(popover).toBeVisible()
    await expect(popover.locator('a[href="/settings"]')).toBeVisible()
    await expect(popover.locator('a[href="/activity-log"]')).toBeVisible()
    await expect(popover.locator('a[href="/completed-projects"]')).toBeVisible()

    await page.mouse.click(6, 6)
    await expect(popover).toHaveCount(0)
  })
})
