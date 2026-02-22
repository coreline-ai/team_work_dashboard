import { expect, request, test } from "@playwright/test"
import { ADMIN_STORAGE_STATE_PATH, E2E_BASE_URL, MEMBER_STORAGE_STATE_PATH } from "./support/e2e-data"

test.describe("Project Write Permissions", () => {
  test("guest and member cannot create projects, admin can", async ({ request: guestRequest }) => {
    const projectName = `E2E Permission Project ${Date.now()}`

    const guestRes = await guestRequest.post("/api/projects", {
      data: { name: projectName, description: "guest create attempt" },
    })
    expect(guestRes.status()).toBe(401)

    const memberApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: MEMBER_STORAGE_STATE_PATH,
    })
    const memberRes = await memberApi.post("/api/projects", {
      data: { name: projectName, description: "member create attempt" },
    })
    expect(memberRes.status()).toBe(403)
    await memberApi.dispose()

    const adminApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: ADMIN_STORAGE_STATE_PATH,
    })

    const createRes = await adminApi.post("/api/projects", {
      data: { name: projectName, description: "admin create" },
    })
    expect(createRes.status()).toBe(201)

    const createBody = (await createRes.json()) as { project: { id: string } }
    const projectId = createBody.project.id

    const publicRes = await guestRequest.get("/api/public/projects")
    expect(publicRes.ok()).toBeTruthy()
    const publicBody = (await publicRes.json()) as { projects?: Array<{ id: string; name: string }> }
    expect((publicBody.projects ?? []).some((project) => project.id === projectId)).toBeTruthy()

    const archiveRes = await adminApi.patch(`/api/projects/${projectId}`, {
      data: { isArchived: true },
    })
    expect(archiveRes.ok()).toBeTruthy()

    await adminApi.dispose()
  })
})
