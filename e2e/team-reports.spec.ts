import { expect, request, test } from "@playwright/test"
import {
  ADMIN_STORAGE_STATE_PATH,
  E2E_BASE_URL,
  MEMBER_STORAGE_STATE_PATH,
} from "./support/e2e-data"

test.describe("Team Reports", () => {
  test("api permissions and csv export policy", async ({ request: guestRequest }) => {
    const guestRes = await guestRequest.get("/api/team-reports/weekly")
    expect(guestRes.status()).toBe(401)

    const memberApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: MEMBER_STORAGE_STATE_PATH,
    })
    const adminApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: ADMIN_STORAGE_STATE_PATH,
    })

    const memberReadRes = await memberApi.get("/api/team-reports/weekly")
    expect(memberReadRes.ok()).toBeTruthy()
    const memberReadBody = (await memberReadRes.json()) as {
      summary?: { totalTasks: number }
      sla?: { delayedRate: number }
    }
    expect(typeof memberReadBody.summary?.totalTasks).toBe("number")
    expect(typeof memberReadBody.sla?.delayedRate).toBe("number")

    const memberSnapshotCreateRes = await memberApi.post("/api/team-reports/weekly/snapshots", {
      data: {},
    })
    expect(memberSnapshotCreateRes.status()).toBe(403)

    const adminSnapshotCreateRes = await adminApi.post("/api/team-reports/weekly/snapshots", {
      data: {},
    })
    expect(adminSnapshotCreateRes.status()).toBe(201)

    const snapshotsRes = await adminApi.get("/api/team-reports/weekly/snapshots?limit=12")
    expect(snapshotsRes.ok()).toBeTruthy()
    const snapshotsBody = (await snapshotsRes.json()) as { items?: Array<{ id: string; weekStart: string }> }
    expect((snapshotsBody.items ?? []).length).toBeGreaterThan(0)

    const adminExportRes = await adminApi.get("/api/team-reports/weekly/export?source=live")
    expect(adminExportRes.ok()).toBeTruthy()
    expect(adminExportRes.headers()["content-type"]).toContain("text/csv")
    const csvBody = await adminExportRes.text()
    expect(csvBody.startsWith("\uFEFF")).toBeTruthy()

    const memberExportRes = await memberApi.get("/api/team-reports/weekly/export?source=live")
    expect(memberExportRes.status()).toBe(403)

    await memberApi.dispose()
    await adminApi.dispose()
  })

  test("admin-only controls are hidden for member on page", async ({ browser }) => {
    const adminContext = await browser.newContext({ storageState: ADMIN_STORAGE_STATE_PATH })
    const adminPage = await adminContext.newPage()
    await adminPage.goto("/team-reports")
    await expect(adminPage.getByTestId("team-reports-create-snapshot")).toBeVisible()
    await expect(adminPage.getByTestId("team-reports-export-csv")).toBeVisible()
    await adminContext.close()

    const memberContext = await browser.newContext({ storageState: MEMBER_STORAGE_STATE_PATH })
    const memberPage = await memberContext.newPage()
    await memberPage.goto("/team-reports")
    await expect(memberPage.getByTestId("team-reports-create-snapshot")).toHaveCount(0)
    await expect(memberPage.getByTestId("team-reports-export-csv")).toHaveCount(0)
    await memberContext.close()
  })
})
