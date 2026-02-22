import fs from "node:fs"
import path from "node:path"

export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000"

export const AUTH_DIR_PATH = path.join(process.cwd(), "e2e", ".auth")
export const ADMIN_STORAGE_STATE_PATH = path.join(AUTH_DIR_PATH, "admin.json")
export const MEMBER_STORAGE_STATE_PATH = path.join(AUTH_DIR_PATH, "member.json")
export const FIXTURE_PATH = path.join(AUTH_DIR_PATH, "fixture.json")

export interface E2EFixture {
  projectId: string
  projectName: string
  phase: string
  memberUserId: string
  adminUserId: string
  memberTaskId: string
  memberTaskTitle: string
  adminTaskId: string
  adminTaskTitle: string
}

export function readFixture(): E2EFixture {
  const raw = fs.readFileSync(FIXTURE_PATH, "utf8")
  return JSON.parse(raw) as E2EFixture
}
