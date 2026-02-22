import { expect, request, test } from "@playwright/test"
import {
  E2E_BASE_URL,
  MEMBER_STORAGE_STATE_PATH,
  readFixture,
} from "./support/e2e-data"

test.describe("Activity Log Diff", () => {
  test.use({ storageState: MEMBER_STORAGE_STATE_PATH })

  test("task update produces field-level diff and renders in UI", async ({ page }) => {
    const fixture = readFixture()
    const memberApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: MEMBER_STORAGE_STATE_PATH,
    })

    const bumpRes = await memberApi.patch(`/api/tasks/${fixture.memberTaskId}`, {
      data: { progress: 41 },
    })
    expect(bumpRes.ok()).toBeTruthy()

    const logsRes = await memberApi.get("/api/activity-logs?action=TASK_UPDATE&pageSize=50")
    expect(logsRes.ok()).toBeTruthy()
    const logsBody = (await logsRes.json()) as {
      items?: Array<{
        entityId: string
        diff?: Array<{ fieldPath: string; changeType: string }>
      }>
    }

    const target = (logsBody.items ?? []).find((item) => item.entityId === fixture.memberTaskId)
    expect(target).toBeTruthy()
    expect((target?.diff ?? []).some((row) => row.fieldPath === "progress" && row.changeType === "changed")).toBeTruthy()

    await page.goto("/activity-log")
    await page.getByRole("button", { name: "보기" }).first().click()
    await expect(page.getByTestId("activity-diff-table")).toBeVisible()

    const rollbackRes = await memberApi.patch(`/api/tasks/${fixture.memberTaskId}`, {
      data: { progress: 35 },
    })
    expect(rollbackRes.ok()).toBeTruthy()

    await memberApi.dispose()
  })
})
