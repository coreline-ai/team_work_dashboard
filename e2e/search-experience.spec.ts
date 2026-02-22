import { expect, request, test } from "@playwright/test"
import {
  E2E_BASE_URL,
  MEMBER_STORAGE_STATE_PATH,
  readFixture,
} from "./support/e2e-data"

test.describe("Search Experience", () => {
  test("guest quick search finds exact text and closes on outside click/escape", async ({ page }) => {
    const fixture = readFixture()

    await page.goto("/")
    const input = page.getByPlaceholder("Search tasks, projects, members...")

    await input.fill(fixture.memberTaskTitle)
    await expect(page.getByTestId("header-search-dropdown")).toBeVisible()
    await expect(page.getByRole("button", { name: new RegExp(fixture.memberTaskTitle, "i") }).first()).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(page.getByTestId("header-search-dropdown")).toHaveCount(0)

    await input.click()
    await input.fill(`${fixture.memberTaskTitle} `)
    await input.press("Backspace")
    await expect(page.getByTestId("header-search-dropdown")).toBeVisible()
    await page.locator("main").first().click({ position: { x: 16, y: 16 } })
    await expect(page.getByTestId("header-search-dropdown")).toHaveCount(0)
  })

  test("guest alias query maps Korean keyword to Android task", async ({ page }) => {
    await page.goto("/")
    const input = page.getByPlaceholder("Search tasks, projects, members...")

    await input.fill("안드로이드")
    const dropdown = page.getByTestId("header-search-dropdown")
    await expect(dropdown).toBeVisible()
    await expect(dropdown.getByText(/Android/i).first()).toBeVisible()
  })

  test("scope/status/phase/project filter combination stays consistent with permission boundary", async ({ request: guestRequest }) => {
    const fixture = readFixture()
    const publicParams = new URLSearchParams({
      q: fixture.memberTaskTitle,
      scope: "TASK",
      status: "IN_PROGRESS",
      phase: fixture.phase,
      projectId: fixture.projectId,
    })

    const publicRes = await guestRequest.get(`/api/public/search?${publicParams.toString()}`)
    expect(publicRes.ok()).toBeTruthy()
    const publicBody = (await publicRes.json()) as { tasks?: Array<{ id: string }> }
    expect((publicBody.tasks ?? []).some((task) => task.id === fixture.memberTaskId)).toBeTruthy()

    const memberApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: MEMBER_STORAGE_STATE_PATH,
    })

    const forbiddenParams = new URLSearchParams({
      q: fixture.adminTaskTitle,
      scope: "TASK",
      status: "PENDING",
      phase: fixture.phase,
      projectId: fixture.projectId,
    })
    const forbiddenRes = await memberApi.get(`/api/search?${forbiddenParams.toString()}`)
    expect(forbiddenRes.ok()).toBeTruthy()
    const forbiddenBody = (await forbiddenRes.json()) as { tasks?: Array<{ id: string }> }
    expect((forbiddenBody.tasks ?? []).some((task) => task.id === fixture.adminTaskId)).toBeFalsy()

    await memberApi.dispose()
  })
})
