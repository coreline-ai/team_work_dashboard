import { NextResponse } from "next/server"
import { requireUser, unauthorized } from "@/lib/api"
import { getCompletedProjectManagementData } from "@/lib/projects"

export async function GET() {
  const user = await requireUser()
  if (!user) return unauthorized()

  const payload = await getCompletedProjectManagementData()
  const now = Date.now()
  const days30 = 30 * 24 * 60 * 60 * 1000

  const completedIn30Days = payload.projects.filter(
    (project) => now - new Date(project.completedAt).getTime() <= days30,
  ).length

  return NextResponse.json({
    projects: payload.projects,
    history: payload.history,
    summary: {
      totalCompletedProjects: payload.projects.length,
      completedIn30Days,
    },
  })
}
