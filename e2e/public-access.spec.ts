import { expect, test } from "@playwright/test"
import { readFixture } from "./support/e2e-data"

test.describe("Public Read Access", () => {
  test("guest can access public routes", async ({ page }) => {
    const fixture = readFixture()

    const routes = [
      "/",
      "/dashboard/portfolio",
      `/dashboard/projects/${fixture.projectId}`,
      "/tasks",
      "/projects",
      "/team-members",
      "/search",
    ]

    for (const route of routes) {
      const response = await page.goto(route)
      expect(response, `response should exist for ${route}`).not.toBeNull()
      expect(response!.status(), `route should be accessible: ${route}`).toBeLessThan(400)
    }
  })

  test("guest is redirected to login for protected page", async ({ page }) => {
    await page.goto("/settings")
    await expect(page).toHaveURL(/\/login/)
  })
})
