import { expect, request, test } from "@playwright/test"
import { ADMIN_STORAGE_STATE_PATH, E2E_BASE_URL, MEMBER_STORAGE_STATE_PATH } from "./support/e2e-data"

test.describe("Completed Projects Flow", () => {
  test("complete/reopen lifecycle enforces permissions and list visibility", async ({ request: guestRequest }) => {
    const projectName = `E2E Complete Flow ${Date.now()}`

    const memberApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: MEMBER_STORAGE_STATE_PATH,
    })
    const adminApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: ADMIN_STORAGE_STATE_PATH,
    })

    const createRes = await adminApi.post("/api/projects", {
      data: {
        name: projectName,
        description: "complete/reopen e2e flow",
      },
    })
    expect(createRes.status()).toBe(201)
    const createBody = (await createRes.json()) as { project: { id: string } }
    const projectId = createBody.project.id

    const guestCompletedRes = await guestRequest.get("/api/projects/completed")
    expect(guestCompletedRes.status()).toBe(401)

    const memberCompleteRes = await memberApi.patch(`/api/projects/${projectId}/complete`, {
      data: { note: "member should fail" },
    })
    expect(memberCompleteRes.status()).toBe(403)

    const adminCompleteRes = await adminApi.patch(`/api/projects/${projectId}/complete`, {
      data: { note: "done by e2e admin" },
    })
    expect(adminCompleteRes.ok()).toBeTruthy()

    const publicAfterCompleteRes = await guestRequest.get("/api/public/projects")
    expect(publicAfterCompleteRes.ok()).toBeTruthy()
    const publicAfterCompleteBody = (await publicAfterCompleteRes.json()) as {
      projects?: Array<{ id: string }>
    }
    expect((publicAfterCompleteBody.projects ?? []).some((project) => project.id === projectId)).toBeFalsy()

    const completedRes = await adminApi.get("/api/projects/completed")
    expect(completedRes.ok()).toBeTruthy()
    const completedBody = (await completedRes.json()) as {
      projects?: Array<{ id: string; completionNote?: string | null }>
      history?: Array<{ projectId: string; action: string }>
    }
    expect((completedBody.projects ?? []).some((project) => project.id === projectId)).toBeTruthy()
    expect(
      (completedBody.projects ?? []).some(
        (project) => project.id === projectId && project.completionNote === "done by e2e admin",
      ),
    ).toBeTruthy()
    expect(
      (completedBody.history ?? []).some(
        (item) => item.projectId === projectId && item.action === "PROJECT_COMPLETE",
      ),
    ).toBeTruthy()

    const reopenRes = await adminApi.patch(`/api/projects/${projectId}/reopen`)
    expect(reopenRes.ok()).toBeTruthy()

    const publicAfterReopenRes = await guestRequest.get("/api/public/projects")
    expect(publicAfterReopenRes.ok()).toBeTruthy()
    const publicAfterReopenBody = (await publicAfterReopenRes.json()) as {
      projects?: Array<{ id: string }>
    }
    expect((publicAfterReopenBody.projects ?? []).some((project) => project.id === projectId)).toBeTruthy()

    await adminApi.patch(`/api/projects/${projectId}`, {
      data: { isArchived: true },
    })

    await memberApi.dispose()
    await adminApi.dispose()
  })
})
