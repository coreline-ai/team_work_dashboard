import { expect, request, test } from "@playwright/test"
import {
  ADMIN_STORAGE_STATE_PATH,
  E2E_BASE_URL,
  MEMBER_STORAGE_STATE_PATH,
  readFixture,
} from "./support/e2e-data"

test.describe("Activity Log Permissions", () => {
  test("member sees only own logs and admin can filter by actor", async () => {
    const fixture = readFixture()

    const memberApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: MEMBER_STORAGE_STATE_PATH,
    })
    const adminApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: ADMIN_STORAGE_STATE_PATH,
    })

    const memberWriteRes = await memberApi.patch(`/api/tasks/${fixture.memberTaskId}`, {
      data: { progress: 36 },
    })
    expect(memberWriteRes.ok()).toBeTruthy()

    const memberRollbackRes = await memberApi.patch(`/api/tasks/${fixture.memberTaskId}`, {
      data: { progress: 35 },
    })
    expect(memberRollbackRes.ok()).toBeTruthy()

    const memberLogsRes = await memberApi.get(`/api/activity-logs?actorUserId=${fixture.adminUserId}&pageSize=50`)
    expect(memberLogsRes.ok()).toBeTruthy()
    const memberLogsBody = (await memberLogsRes.json()) as {
      items?: Array<{ actor?: { id: string } | null }>
    }
    for (const item of memberLogsBody.items ?? []) {
      expect(item.actor?.id).toBe(fixture.memberUserId)
    }

    const adminFilteredRes = await adminApi.get(`/api/activity-logs?actorUserId=${fixture.memberUserId}&pageSize=50`)
    expect(adminFilteredRes.ok()).toBeTruthy()
    const adminFilteredBody = (await adminFilteredRes.json()) as {
      items?: Array<{ actor?: { id: string } | null }>
    }
    for (const item of adminFilteredBody.items ?? []) {
      expect(item.actor?.id).toBe(fixture.memberUserId)
    }

    await memberApi.dispose()
    await adminApi.dispose()
  })
})
