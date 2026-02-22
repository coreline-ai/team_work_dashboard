import { expect, request, test } from "@playwright/test"
import {
  ADMIN_STORAGE_STATE_PATH,
  E2E_BASE_URL,
  MEMBER_STORAGE_STATE_PATH,
  readFixture,
} from "./support/e2e-data"

test.describe("Search Synonym Dictionary Admin Controls", () => {
  test("permissions are enforced on synonym settings API", async ({ request: guestRequest }) => {
    const guestRes = await guestRequest.get("/api/projects/settings/synonyms")
    expect(guestRes.status()).toBe(401)

    const memberApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: MEMBER_STORAGE_STATE_PATH,
    })
    const memberRes = await memberApi.get("/api/projects/settings/synonyms")
    expect(memberRes.status()).toBe(403)
    await memberApi.dispose()

    const adminApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: ADMIN_STORAGE_STATE_PATH,
    })
    const adminRes = await adminApi.get("/api/projects/settings/synonyms")
    expect(adminRes.ok()).toBeTruthy()
    await adminApi.dispose()
  })

  test("admin synonym CRUD reflects in public search results", async ({ request: guestRequest }) => {
    const fixture = readFixture()
    const adminApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: ADMIN_STORAGE_STATE_PATH,
    })

    const createKeyword = "memberalias"
    const updateKeyword = "memberaliasv2"
    let createdId = ""

    try {
      const createRes = await adminApi.post("/api/projects/settings/synonyms", {
        data: {
          projectId: fixture.projectId,
          keyword: createKeyword,
          synonyms: [fixture.memberTaskTitle],
          isActive: true,
        },
      })
      expect(createRes.status()).toBe(201)
      const createBody = (await createRes.json()) as { item?: { id: string } }
      createdId = createBody.item?.id ?? ""
      expect(createdId).toBeTruthy()

      const searchByCreateRes = await guestRequest.get(
        `/api/public/search?scope=TASK&projectId=${fixture.projectId}&q=${createKeyword}`,
      )
      expect(searchByCreateRes.ok()).toBeTruthy()
      const searchByCreateBody = (await searchByCreateRes.json()) as { tasks?: Array<{ id: string }> }
      expect((searchByCreateBody.tasks ?? []).some((task) => task.id === fixture.memberTaskId)).toBeTruthy()

      const updateRes = await adminApi.patch(`/api/projects/settings/synonyms/${createdId}`, {
        data: {
          keyword: updateKeyword,
          synonyms: [fixture.memberTaskTitle],
          isActive: true,
          projectId: fixture.projectId,
        },
      })
      expect(updateRes.ok()).toBeTruthy()

      const searchByUpdateRes = await guestRequest.get(
        `/api/public/search?scope=TASK&projectId=${fixture.projectId}&q=${updateKeyword}`,
      )
      expect(searchByUpdateRes.ok()).toBeTruthy()
      const searchByUpdateBody = (await searchByUpdateRes.json()) as { tasks?: Array<{ id: string }> }
      expect((searchByUpdateBody.tasks ?? []).some((task) => task.id === fixture.memberTaskId)).toBeTruthy()

      const deleteRes = await adminApi.delete(`/api/projects/settings/synonyms/${createdId}`)
      expect(deleteRes.ok()).toBeTruthy()
      createdId = ""

      const searchAfterDeleteRes = await guestRequest.get(
        `/api/public/search?scope=TASK&projectId=${fixture.projectId}&q=${updateKeyword}`,
      )
      expect(searchAfterDeleteRes.ok()).toBeTruthy()
      const searchAfterDeleteBody = (await searchAfterDeleteRes.json()) as { tasks?: Array<{ id: string }> }
      expect((searchAfterDeleteBody.tasks ?? []).some((task) => task.id === fixture.memberTaskId)).toBeFalsy()
    } finally {
      if (createdId) {
        await adminApi.delete(`/api/projects/settings/synonyms/${createdId}`)
      }
      await adminApi.dispose()
    }
  })
})
