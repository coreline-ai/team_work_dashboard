import fs from "node:fs/promises"
import { chromium, request, type APIRequestContext, type FullConfig } from "@playwright/test"
import {
  ADMIN_STORAGE_STATE_PATH,
  AUTH_DIR_PATH,
  E2E_BASE_URL,
  FIXTURE_PATH,
  MEMBER_STORAGE_STATE_PATH,
  type E2EFixture,
} from "./support/e2e-data"

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "user1@richprop.local"
const MEMBER_EMAIL = process.env.E2E_MEMBER_EMAIL ?? "user2@richprop.local"
const DEFAULT_PASSWORD = process.env.E2E_DEFAULT_PASSWORD ?? "Password123!"

const FIXTURE_PROJECT_NAME = "E2E 권한필터 프로젝트"
const FIXTURE_PHASE = "E2E_PHASE"
const MEMBER_TASK_TITLE = "E2E Member Task"
const ADMIN_TASK_TITLE = "E2E Admin Task"

function getBaseURL(config: FullConfig): string {
  const configured = config.projects[0]?.use?.baseURL
  if (typeof configured === "string" && configured.length > 0) return configured
  return E2E_BASE_URL
}

async function assertOk(res: Awaited<ReturnType<APIRequestContext["get"]>> | Awaited<ReturnType<APIRequestContext["post"]>> | Awaited<ReturnType<APIRequestContext["patch"]>>, label: string) {
  if (res.ok()) return
  const body = await res.text()
  throw new Error(`${label} failed: ${res.status()} ${body}`)
}

async function loginAndSaveStorageState(baseURL: string, email: string, password: string, targetPath: string) {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(`${baseURL}/login`)
  await page.getByTestId("login-email").fill(email)
  await page.getByTestId("login-password").fill(password)

  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 }),
    page.getByTestId("login-submit").click(),
  ])

  await context.storageState({ path: targetPath })
  await context.close()
  await browser.close()
}

async function ensureProject(api: APIRequestContext) {
  const listRes = await api.get("/api/projects?includeArchived=true")
  await assertOk(listRes, "list projects")
  const listBody = (await listRes.json()) as { projects?: Array<{ id: string; name: string; isArchived: boolean }> }

  const existing = (listBody.projects ?? []).find((project) => project.name === FIXTURE_PROJECT_NAME)
  if (existing) {
    if (existing.isArchived) {
      const unarchiveRes = await api.patch(`/api/projects/${existing.id}`, {
        data: { isArchived: false },
      })
      await assertOk(unarchiveRes, "unarchive fixture project")
    }
    return { id: existing.id, name: FIXTURE_PROJECT_NAME }
  }

  const createRes = await api.post("/api/projects", {
    data: {
      name: FIXTURE_PROJECT_NAME,
      description: "E2E 테스트용 프로젝트",
    },
  })
  await assertOk(createRes, "create fixture project")
  const createBody = (await createRes.json()) as { project: { id: string; name: string } }

  return { id: createBody.project.id, name: createBody.project.name }
}

async function ensureTask(params: {
  api: APIRequestContext
  projectId: string
  title: string
  assigneeId: string
  status: "PENDING" | "IN_PROGRESS"
  progress: number
}) {
  const { api, projectId, title, assigneeId, status, progress } = params
  const query = new URLSearchParams({ assignee: "all", projectId, q: title }).toString()

  const listRes = await api.get(`/api/tasks?${query}`)
  await assertOk(listRes, `list task ${title}`)
  const listBody = (await listRes.json()) as {
    tasks?: Array<{ id: string; title: string; projectId: string }>
  }

  const existing = (listBody.tasks ?? []).find((task) => task.title === title && task.projectId === projectId)
  const startDate = "2026-02-01"
  const endDate = "2026-04-01"

  if (existing) {
    const patchRes = await api.patch(`/api/tasks/${existing.id}`, {
      data: {
        phase: FIXTURE_PHASE,
        status,
        progress,
        assigneeId,
        startDate,
        endDate,
      },
    })
    await assertOk(patchRes, `normalize task ${title}`)
    return existing.id
  }

  const createRes = await api.post("/api/tasks", {
    data: {
      title,
      description: "E2E fixture task",
      phase: FIXTURE_PHASE,
      status,
      priority: "MEDIUM",
      startDate,
      endDate,
      progress,
      parentId: null,
      assigneeId,
      projectId,
    },
  })
  await assertOk(createRes, `create task ${title}`)
  const createBody = (await createRes.json()) as { task: { id: string } }

  return createBody.task.id
}

async function prepareFixture(baseURL: string) {
  const api = await request.newContext({ baseURL, storageState: ADMIN_STORAGE_STATE_PATH })

  const meRes = await api.get("/api/me")
  await assertOk(meRes, "admin me")
  const meBody = (await meRes.json()) as { user: { id: string; role: "ADMIN" | "MEMBER" } }

  const usersRes = await api.get("/api/users")
  await assertOk(usersRes, "list users")
  const usersBody = (await usersRes.json()) as {
    users?: Array<{ id: string; email: string; role: "ADMIN" | "MEMBER"; isActive: boolean }>
  }

  const member = (usersBody.users ?? []).find((user) => user.role === "MEMBER" && user.isActive)
  if (!member) {
    throw new Error("No active MEMBER account found for E2E fixture")
  }

  const project = await ensureProject(api)

  const memberTaskId = await ensureTask({
    api,
    projectId: project.id,
    title: MEMBER_TASK_TITLE,
    assigneeId: member.id,
    status: "IN_PROGRESS",
    progress: 35,
  })

  const adminTaskId = await ensureTask({
    api,
    projectId: project.id,
    title: ADMIN_TASK_TITLE,
    assigneeId: meBody.user.id,
    status: "PENDING",
    progress: 10,
  })

  const fixture: E2EFixture = {
    projectId: project.id,
    projectName: project.name,
    phase: FIXTURE_PHASE,
    memberUserId: member.id,
    adminUserId: meBody.user.id,
    memberTaskId,
    memberTaskTitle: MEMBER_TASK_TITLE,
    adminTaskId,
    adminTaskTitle: ADMIN_TASK_TITLE,
  }

  await fs.writeFile(FIXTURE_PATH, JSON.stringify(fixture, null, 2), "utf8")
  await api.dispose()
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = getBaseURL(config)
  await fs.mkdir(AUTH_DIR_PATH, { recursive: true })

  await loginAndSaveStorageState(baseURL, ADMIN_EMAIL, DEFAULT_PASSWORD, ADMIN_STORAGE_STATE_PATH)
  await loginAndSaveStorageState(baseURL, MEMBER_EMAIL, DEFAULT_PASSWORD, MEMBER_STORAGE_STATE_PATH)
  await prepareFixture(baseURL)
}
