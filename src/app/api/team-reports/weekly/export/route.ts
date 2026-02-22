import { NextResponse } from "next/server"
import { z } from "zod"
import { forbidden, requireUser, unauthorized } from "@/lib/api"
import { canManageProjects } from "@/lib/permissions"
import {
  buildWeeklyTeamReport,
  getWeeklySnapshotByWeekStart,
  toWeeklyReportCsv,
} from "@/lib/team-reports"
import type { WeeklyTeamReport } from "@/types/domain"

const querySchema = z.object({
  weekStart: z.string().optional(),
  source: z.enum(["live", "snapshot"]).default("live"),
})

export async function GET(req: Request) {
  const user = await requireUser()
  if (!user) return unauthorized()
  if (!canManageProjects(user.role)) return forbidden("관리자만 CSV 내보내기를 수행할 수 있습니다.")

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    weekStart: searchParams.get("weekStart") ?? undefined,
    source: searchParams.get("source") ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid query parameters", details: parsed.error.flatten() }, { status: 400 })
  }

  let report: WeeklyTeamReport
  if (parsed.data.source === "snapshot") {
    const snapshot = await getWeeklySnapshotByWeekStart(parsed.data.weekStart)
    if (!snapshot) {
      return NextResponse.json({ message: "Snapshot not found for requested weekStart" }, { status: 404 })
    }

    report = {
      weekStart: snapshot.weekStart,
      summary: snapshot.summary,
      sla: snapshot.sla,
      members: snapshot.members as WeeklyTeamReport["members"],
      projects: snapshot.projects as WeeklyTeamReport["projects"],
    }
  } else {
    report = await buildWeeklyTeamReport({ weekStart: parsed.data.weekStart })
  }

  const csv = toWeeklyReportCsv(report)
  const filename = `team-weekly-report-${report.weekStart.slice(0, 10)}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
