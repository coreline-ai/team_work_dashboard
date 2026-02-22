import { expect, request, test, type APIRequestContext } from "@playwright/test"
import {
  ADMIN_STORAGE_STATE_PATH,
  E2E_BASE_URL,
  MEMBER_STORAGE_STATE_PATH,
  readFixture,
} from "./support/e2e-data"

interface NotificationDto {
  id: string
  type: string
  title: string
  body: string
  relatedTaskId?: string | null
}

async function hasNotificationTypeForTask(api: APIRequestContext, type: string, taskId: string) {
  const res = await api.get("/api/notifications")
  if (!res.ok()) return false
  const body = (await res.json()) as { notifications?: NotificationDto[] }
  return (body.notifications ?? []).some((item) => item.type === type && item.relatedTaskId === taskId)
}

test.describe("Shared Notification Broadcast", () => {
  test("task create/update/delete events are broadcast to admin and member feeds", async () => {
    const fixture = readFixture()
    const marker = Date.now()
    const taskTitle = `E2E Broadcast ${marker}`

    const adminApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: ADMIN_STORAGE_STATE_PATH,
    })
    const memberApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: MEMBER_STORAGE_STATE_PATH,
    })

    const createRes = await memberApi.post("/api/tasks", {
      data: {
        title: taskTitle,
        description: "broadcast e2e",
        phase: fixture.phase,
        status: "PENDING",
        priority: "MEDIUM",
        startDate: "2026-02-01",
        endDate: "2026-03-01",
        progress: 5,
        parentId: null,
        assigneeId: fixture.memberUserId,
        projectId: fixture.projectId,
      },
    })
    expect(createRes.status()).toBe(201)
    const createBody = (await createRes.json()) as { task: { id: string } }
    const taskId = createBody.task.id

    await expect
      .poll(async () => hasNotificationTypeForTask(adminApi, "TASK_CREATED", taskId), { timeout: 20_000 })
      .toBeTruthy()
    await expect
      .poll(async () => hasNotificationTypeForTask(memberApi, "TASK_CREATED", taskId), { timeout: 20_000 })
      .toBeTruthy()

    const updateRes = await memberApi.patch(`/api/tasks/${taskId}`, {
      data: {
        status: "IN_PROGRESS",
        assigneeId: fixture.adminUserId,
        progress: 20,
      },
    })
    expect(updateRes.ok()).toBeTruthy()

    await expect
      .poll(async () => hasNotificationTypeForTask(adminApi, "TASK_UPDATED", taskId), { timeout: 20_000 })
      .toBeTruthy()
    await expect
      .poll(async () => hasNotificationTypeForTask(adminApi, "STATUS_CHANGED", taskId), { timeout: 20_000 })
      .toBeTruthy()
    await expect
      .poll(async () => hasNotificationTypeForTask(adminApi, "ASSIGNEE_CHANGED", taskId), { timeout: 20_000 })
      .toBeTruthy()

    const deleteRes = await memberApi.delete(`/api/tasks/${taskId}`)
    expect(deleteRes.ok()).toBeTruthy()

    await expect
      .poll(async () => hasNotificationTypeForTask(adminApi, "TASK_DELETED", taskId), { timeout: 20_000 })
      .toBeTruthy()
    await expect
      .poll(async () => hasNotificationTypeForTask(memberApi, "TASK_DELETED", taskId), { timeout: 20_000 })
      .toBeTruthy()

    await adminApi.dispose()
    await memberApi.dispose()
  })
})
