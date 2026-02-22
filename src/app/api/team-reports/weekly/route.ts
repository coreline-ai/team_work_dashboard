import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, unauthorized } from "@/lib/api"
import { buildWeeklyTeamReport, getWeeklySnapshotByWeekStart } from "@/lib/team-reports"

const querySchema = z.object({
  weekStart: z.string().optional(),
  memberId: z.string().optional(),
  projectId: z.string().optional(),
  source: z.enum(["live", "snapshot"]).default("live"),
})

export async function GET(req: Request) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    weekStart: searchParams.get("weekStart") ?? undefined,
    memberId: searchParams.get("memberId") ?? undefined,
    projectId: searchParams.get("projectId") ?? undefined,
    source: searchParams.get("source") ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid query parameters", details: parsed.error.flatten() }, { status: 400 })
  }

  if (parsed.data.source === "snapshot") {
    const snapshot = await getWeeklySnapshotByWeekStart(parsed.data.weekStart)
    if (!snapshot) {
      return NextResponse.json({ message: "Snapshot not found for requested weekStart" }, { status: 404 })
    }

    return NextResponse.json({
      weekStart: snapshot.weekStart,
      summary: snapshot.summary,
      sla: snapshot.sla,
      members: snapshot.members,
      projects: snapshot.projects,
      source: "snapshot",
    })
  }

  const report = await buildWeeklyTeamReport(parsed.data)
  return NextResponse.json({ ...report, source: "live" })
}
