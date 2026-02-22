import { expect, request, test, type APIRequestContext } from "@playwright/test"
import {
  ADMIN_STORAGE_STATE_PATH,
  E2E_BASE_URL,
  MEMBER_STORAGE_STATE_PATH,
  readFixture,
} from "./support/e2e-data"

interface NotificationRow {
  id: string
  relatedTaskId?: string | null
  canQuickAct?: boolean
}

async function findNotificationIdForTask(
  api: APIRequestContext,
  taskId: string,
  options?: { requireQuickAct?: boolean },
) {
  const res = await api.get("/api/notifications")
  if (!res.ok()) return null
  const body = (await res.json()) as { notifications?: NotificationRow[] }
  const row = (body.notifications ?? []).find((item) => {
    if (item.relatedTaskId !== taskId) return false
    if (options?.requireQuickAct) return item.canQuickAct === true
    return true
  })
  return row?.id ?? null
}

async function readTaskById(
  api: APIRequestContext,
  projectId: string,
  taskId: string,
) {
  const res = await api.get(`/api/tasks?assignee=all&projectId=${projectId}`)
  if (!res.ok()) return null
  const body = (await res.json()) as { tasks?: Array<{ id: string; status: string; assigneeId: string }> }
  return (body.tasks ?? []).find((task) => task.id === taskId) ?? null
}

test.describe("Notification Quick Actions", () => {
  test("admin can run quick actions and member is blocked", async () => {
    const fixture = readFixture()
    const marker = Date.now()
    const tempTaskTitle = `E2E QuickAction ${marker}`
    const adminApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: ADMIN_STORAGE_STATE_PATH,
    })
    const memberApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: MEMBER_STORAGE_STATE_PATH,
    })

    const createTaskRes = await adminApi.post("/api/tasks", {
      data: {
        title: tempTaskTitle,
        description: "quick action e2e task",
        phase: fixture.phase,
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        startDate: "2026-02-01",
        endDate: "2026-04-01",
        progress: 25,
        parentId: null,
        assigneeId: fixture.memberUserId,
        projectId: fixture.projectId,
      },
    })
    expect(createTaskRes.status()).toBe(201)
    const createTaskBody = (await createTaskRes.json()) as { task: { id: string } }
    const tempTaskId = createTaskBody.task.id

    const kickEventRes = await memberApi.patch(`/api/tasks/${tempTaskId}`, {
      data: { status: "DELAYED" },
    })
    expect(kickEventRes.ok()).toBeTruthy()

    let adminNotificationId: string | null = null
    await expect
      .poll(async () => {
        adminNotificationId = await findNotificationIdForTask(adminApi, tempTaskId, { requireQuickAct: true })
        return Boolean(adminNotificationId)
      }, { timeout: 20_000 })
      .toBeTruthy()

    let memberNotificationId: string | null = null
    await expect
      .poll(async () => {
        memberNotificationId = await findNotificationIdForTask(memberApi, tempTaskId)
        return Boolean(memberNotificationId)
      }, { timeout: 20_000 })
      .toBeTruthy()
    if (!adminNotificationId || !memberNotificationId) {
      throw new Error("Failed to resolve notification ids for quick-action test")
    }

    const memberQuickActionRes = await memberApi.patch(`/api/notifications/${memberNotificationId}/action`, {
      data: {
        actionType: "CHANGE_STATUS",
        status: "COMPLETED",
      },
    })
    expect(memberQuickActionRes.status()).toBe(403)

    const adminStatusActionRes = await adminApi.patch(`/api/notifications/${adminNotificationId}/action`, {
      data: {
        actionType: "CHANGE_STATUS",
        status: "COMPLETED",
      },
    })
    expect(adminStatusActionRes.ok()).toBeTruthy()

    await expect
      .poll(async () => {
        const row = await readTaskById(adminApi, fixture.projectId, tempTaskId)
        return row?.status ?? null
      }, { timeout: 20_000 })
      .toBe("COMPLETED")

    const adminAssigneeActionRes = await adminApi.patch(`/api/notifications/${adminNotificationId}/action`, {
      data: {
        actionType: "CHANGE_ASSIGNEE",
        assigneeId: fixture.adminUserId,
      },
    })
    expect(adminAssigneeActionRes.ok()).toBeTruthy()

    await expect
      .poll(async () => {
        const row = await readTaskById(adminApi, fixture.projectId, tempTaskId)
        return row?.assigneeId ?? null
      }, { timeout: 20_000 })
      .toBe(fixture.adminUserId)

    const cleanupRes = await adminApi.delete(`/api/tasks/${tempTaskId}`)
    expect(cleanupRes.ok()).toBeTruthy()

    await adminApi.dispose()
    await memberApi.dispose()
  })
})
