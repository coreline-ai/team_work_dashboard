import { expect, request, test } from "@playwright/test"
import {
  ADMIN_STORAGE_STATE_PATH,
  E2E_BASE_URL,
  MEMBER_STORAGE_STATE_PATH,
  readFixture,
} from "./support/e2e-data"

test.describe("Task Permissions and Filter Combinations", () => {
  test("project filter combination works for public and authenticated endpoints", async ({ request: guestRequest }) => {
    const fixture = readFixture()

    const publicParams = new URLSearchParams({
      projectId: fixture.projectId,
      status: "IN_PROGRESS",
      phase: fixture.phase,
      q: fixture.memberTaskTitle,
    })

    const publicRes = await guestRequest.get(`/api/public/tasks?${publicParams.toString()}`)
    expect(publicRes.ok()).toBeTruthy()

    const publicBody = (await publicRes.json()) as {
      tasks?: Array<{ projectId: string; status: string; phase: string; title: string }>
    }
    const publicTasks = publicBody.tasks ?? []
    expect(publicTasks.length).toBeGreaterThan(0)
    for (const task of publicTasks) {
      expect(task.projectId).toBe(fixture.projectId)
      expect(task.status).toBe("IN_PROGRESS")
      expect(task.phase).toContain(fixture.phase)
      expect(task.title.toLowerCase()).toContain(fixture.memberTaskTitle.toLowerCase())
    }

    const memberApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: MEMBER_STORAGE_STATE_PATH,
    })

    const memberParams = new URLSearchParams({
      assignee: "all",
      projectId: fixture.projectId,
      status: "IN_PROGRESS",
      phase: fixture.phase,
      q: fixture.memberTaskTitle,
    })
    const memberRes = await memberApi.get(`/api/tasks?${memberParams.toString()}`)
    expect(memberRes.ok()).toBeTruthy()

    const memberBody = (await memberRes.json()) as {
      tasks?: Array<{ id: string; projectId: string; status: string; phase: string; title: string }>
    }
    const memberTasks = memberBody.tasks ?? []
    expect(memberTasks.some((task) => task.id === fixture.memberTaskId)).toBeTruthy()

    for (const task of memberTasks) {
      expect(task.projectId).toBe(fixture.projectId)
      expect(task.status).toBe("IN_PROGRESS")
      expect(task.phase).toContain(fixture.phase)
      expect(task.title.toLowerCase()).toContain(fixture.memberTaskTitle.toLowerCase())
    }

    await memberApi.dispose()
  })

  test("member cannot edit foreign task but admin can", async () => {
    const fixture = readFixture()

    const memberApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: MEMBER_STORAGE_STATE_PATH,
    })

    const forbiddenRes = await memberApi.patch(`/api/tasks/${fixture.adminTaskId}`, {
      data: { progress: 11 },
    })
    expect(forbiddenRes.status()).toBe(403)
    await memberApi.dispose()

    const adminApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: ADMIN_STORAGE_STATE_PATH,
    })

    const allowedRes = await adminApi.patch(`/api/tasks/${fixture.adminTaskId}`, {
      data: { progress: 12 },
    })
    expect(allowedRes.ok()).toBeTruthy()

    const rollbackRes = await adminApi.patch(`/api/tasks/${fixture.adminTaskId}`, {
      data: { progress: 10 },
    })
    expect(rollbackRes.ok()).toBeTruthy()

    await adminApi.dispose()
  })

  test("search scope + task filters respect permission boundaries", async ({ request: guestRequest }) => {
    const fixture = readFixture()

    const publicParams = new URLSearchParams({
      q: fixture.memberTaskTitle,
      scope: "TASK",
      status: "IN_PROGRESS",
      phase: fixture.phase,
      projectId: fixture.projectId,
    })

    const publicSearchRes = await guestRequest.get(`/api/public/search?${publicParams.toString()}`)
    expect(publicSearchRes.ok()).toBeTruthy()
    const publicSearchBody = (await publicSearchRes.json()) as { tasks?: Array<{ id: string }> }
    expect((publicSearchBody.tasks ?? []).some((task) => task.id === fixture.memberTaskId)).toBeTruthy()

    const memberApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: MEMBER_STORAGE_STATE_PATH,
    })

    const forbiddenTaskSearchParams = new URLSearchParams({
      q: fixture.adminTaskTitle,
      scope: "TASK",
      status: "PENDING",
      phase: fixture.phase,
      projectId: fixture.projectId,
    })
    const forbiddenTaskSearchRes = await memberApi.get(`/api/search?${forbiddenTaskSearchParams.toString()}`)
    expect(forbiddenTaskSearchRes.ok()).toBeTruthy()
    const forbiddenTaskSearchBody = (await forbiddenTaskSearchRes.json()) as { tasks?: Array<{ id: string }> }
    expect((forbiddenTaskSearchBody.tasks ?? []).some((task) => task.id === fixture.adminTaskId)).toBeFalsy()

    const ownTaskSearchRes = await memberApi.get(`/api/search?${publicParams.toString()}`)
    expect(ownTaskSearchRes.ok()).toBeTruthy()
    const ownTaskSearchBody = (await ownTaskSearchRes.json()) as { tasks?: Array<{ id: string }> }
    expect((ownTaskSearchBody.tasks ?? []).some((task) => task.id === fixture.memberTaskId)).toBeTruthy()

    await memberApi.dispose()
  })
})
