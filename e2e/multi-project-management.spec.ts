import { expect, request, test } from "@playwright/test"
import { ADMIN_STORAGE_STATE_PATH, E2E_BASE_URL, readFixture } from "./support/e2e-data"

test.describe("Multi Project Management Baseline", () => {
  test("public APIs expose multiple projects and member project buckets", async ({ request: guestRequest }) => {
    const projectsRes = await guestRequest.get("/api/public/projects")
    expect(projectsRes.ok()).toBeTruthy()
    const projectsBody = (await projectsRes.json()) as {
      projects?: Array<{ id: string; name: string }>
    }

    const projects = projectsBody.projects ?? []
    expect(projects.length).toBeGreaterThanOrEqual(3)
    expect(projects.some((project) => project.name === "Smart Leasing Mobile")).toBeTruthy()
    expect(projects.some((project) => project.name === "Sales Analytics CRM")).toBeTruthy()

    for (const project of projects.slice(0, 3)) {
      const tasksRes = await guestRequest.get(`/api/public/tasks?projectId=${project.id}`)
      expect(tasksRes.ok()).toBeTruthy()
      const tasksBody = (await tasksRes.json()) as {
        tasks?: Array<{ projectId: string }>
      }
      const tasks = tasksBody.tasks ?? []
      expect(tasks.length).toBeGreaterThan(0)
      for (const task of tasks) {
        expect(task.projectId).toBe(project.id)
      }
    }

    const membersRes = await guestRequest.get("/api/public/team-members")
    expect(membersRes.ok()).toBeTruthy()
    const membersBody = (await membersRes.json()) as {
      members?: Array<{
        id: string
        projectBuckets?: Array<{ projectId: string; total: number }>
      }>
    }

    const members = membersBody.members ?? []
    expect(members.length).toBeGreaterThan(0)
    expect(
      members.some((member) => (member.projectBuckets ?? []).length >= 2),
    ).toBeTruthy()
  })

  test("admin can view archived-inclusive project list for operation", async () => {
    const adminApi = await request.newContext({
      baseURL: E2E_BASE_URL,
      storageState: ADMIN_STORAGE_STATE_PATH,
    })

    const res = await adminApi.get("/api/projects?includeArchived=true")
    expect(res.ok()).toBeTruthy()
    const body = (await res.json()) as {
      projects?: Array<{ id: string; name: string; taskCount: number }>
    }

    const projects = body.projects ?? []
    expect(projects.length).toBeGreaterThanOrEqual(3)
    expect(projects.some((project) => project.taskCount > 0)).toBeTruthy()

    await adminApi.dispose()
  })

  test("project dashboard shows member workload details and schedule gantt", async ({ page }) => {
    const fixture = readFixture()

    await page.goto(`/dashboard/projects/${fixture.projectId}`)
    await expect(page.getByTestId("project-member-workloads")).toBeVisible()
    await expect(page.getByTestId("project-schedule-gantt")).toBeVisible()

    await page.getByTestId(`member-expand-${fixture.memberUserId}`).click()
    await expect(
      page.getByTestId("project-member-workloads").getByText(fixture.memberTaskTitle).first(),
    ).toBeVisible()

    await page.getByTestId("schedule-tab-member").click()
    await expect(page.getByText("Forecast Completion")).toBeVisible()

    await page.getByTestId("schedule-scale-month").click()
    await expect(page.getByText("스케일: 월간")).toBeVisible()

    await page.getByTestId("schedule-zoom-7d").click()
    await expect(page.getByText("줌: 7일")).toBeVisible()

    await page.getByTestId("schedule-zoom-all").click()
    await expect(page.getByText("줌: 전체")).toBeVisible()

    const ruler = page.getByTestId("gantt-selection-ruler")
    await expect(ruler).toBeVisible()
    const box = await ruler.boundingBox()
    if (!box) {
      throw new Error("gantt-selection-ruler bounding box not found")
    }

    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.5)
    await page.mouse.up()

    await expect(page.getByText("줌: 사용자 지정")).toBeVisible()
    await expect(page.getByTestId("schedule-zoom-custom")).toBeVisible()
    await expect(page.getByTestId("schedule-zoom-reset-custom")).toBeVisible()
  })
})
