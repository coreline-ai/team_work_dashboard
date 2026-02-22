import { addDays } from "date-fns"
import { TaskStatus, type Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { SlaMetrics, TeamWeeklySnapshotItem, WeeklyTeamReport } from "@/types/domain"

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

function toKst(date: Date) {
  return new Date(date.getTime() + KST_OFFSET_MS)
}

function fromKst(date: Date) {
  return new Date(date.getTime() - KST_OFFSET_MS)
}

export function getWeekStartKst(baseDate = new Date()) {
  const kst = toKst(baseDate)
  kst.setUTCHours(0, 0, 0, 0)
  const day = kst.getUTCDay()
  const diffToMonday = (day + 6) % 7
  kst.setUTCDate(kst.getUTCDate() - diffToMonday)
  return fromKst(kst)
}

export function parseWeekStartInput(value?: string | null) {
  if (!value) return getWeekStartKst()
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return getWeekStartKst()
  return getWeekStartKst(parsed)
}

function roundPercent(value: number) {
  return Math.round(value * 100) / 100
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function buildSlaMetrics(tasks: Array<{ status: TaskStatus; endDate: Date }>, referenceDate: Date): SlaMetrics {
  const total = tasks.length
  const inProgressCount = tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length
  const delayedCount = tasks.filter((task) => task.status === TaskStatus.DELAYED).length
  const overdueOpenCount = tasks.filter(
    (task) => task.endDate < referenceDate && task.status !== TaskStatus.COMPLETED,
  ).length
  const dueSoonEnd = addDays(referenceDate, 7)
  const dueSoon7dCount = tasks.filter(
    (task) =>
      task.endDate >= referenceDate &&
      task.endDate <= dueSoonEnd &&
      task.status !== TaskStatus.COMPLETED,
  ).length
  const completedCount = tasks.filter((task) => task.status === TaskStatus.COMPLETED).length

  return {
    inProgressCount,
    delayedCount,
    delayedRate: total === 0 ? 0 : roundPercent((delayedCount / total) * 100),
    overdueOpenCount,
    overdueOpenRate: total === 0 ? 0 : roundPercent((overdueOpenCount / total) * 100),
    dueSoon7dCount,
    completionRatio: total === 0 ? 0 : roundPercent((completedCount / total) * 100),
  }
}

interface BuildReportFilters {
  weekStart?: string | null
  memberId?: string | null
  projectId?: string | null
}

export async function buildWeeklyTeamReport(filters?: BuildReportFilters): Promise<WeeklyTeamReport> {
  const weekStart = parseWeekStartInput(filters?.weekStart)
  const weekEndExclusive = addDays(weekStart, 7)
  const referenceDate = new Date(Math.min(Date.now(), weekEndExclusive.getTime() - 1))

  const where: Prisma.TaskWhereInput = {
    deletedAt: null,
    project: {
      isArchived: false,
      completedAt: null,
      ...(filters?.projectId ? { id: filters.projectId } : {}),
    },
    ...(filters?.memberId ? { assigneeId: filters.memberId } : {}),
    startDate: { lt: weekEndExclusive },
    endDate: { gte: weekStart },
  }

  const tasks = await prisma.task.findMany({
    where,
    select: {
      id: true,
      status: true,
      endDate: true,
      assigneeId: true,
      projectId: true,
      assignee: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  const summary = {
    totalTasks: tasks.length,
    inProgressTasks: tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length,
    completedTasks: tasks.filter((task) => task.status === TaskStatus.COMPLETED).length,
    delayedTasks: tasks.filter((task) => task.status === TaskStatus.DELAYED).length,
    pendingTasks: tasks.filter((task) => task.status === TaskStatus.PENDING).length,
  }

  const sla = buildSlaMetrics(
    tasks.map((task) => ({ status: task.status, endDate: task.endDate })),
    referenceDate,
  )

  const memberMap = new Map<
    string,
    {
      memberId: string
      memberName: string
      role: "ADMIN" | "MEMBER"
      totalTasks: number
      inProgressTasks: number
      completedTasks: number
      delayedTasks: number
      pendingTasks: number
      overdueOpenCount: number
    }
  >()

  const projectMap = new Map<
    string,
    {
      projectId: string
      projectName: string
      totalTasks: number
      inProgressTasks: number
      completedTasks: number
      delayedTasks: number
      pendingTasks: number
      overdueOpenCount: number
    }
  >()

  for (const task of tasks) {
    const member = memberMap.get(task.assigneeId) ?? {
      memberId: task.assignee.id,
      memberName: task.assignee.name,
      role: task.assignee.role,
      totalTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      delayedTasks: 0,
      pendingTasks: 0,
      overdueOpenCount: 0,
    }
    member.totalTasks += 1
    if (task.status === TaskStatus.IN_PROGRESS) member.inProgressTasks += 1
    if (task.status === TaskStatus.COMPLETED) member.completedTasks += 1
    if (task.status === TaskStatus.DELAYED) member.delayedTasks += 1
    if (task.status === TaskStatus.PENDING) member.pendingTasks += 1
    if (task.status !== TaskStatus.COMPLETED && task.endDate < referenceDate) member.overdueOpenCount += 1
    memberMap.set(task.assigneeId, member)

    const project = projectMap.get(task.projectId) ?? {
      projectId: task.project.id,
      projectName: task.project.name,
      totalTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      delayedTasks: 0,
      pendingTasks: 0,
      overdueOpenCount: 0,
    }
    project.totalTasks += 1
    if (task.status === TaskStatus.IN_PROGRESS) project.inProgressTasks += 1
    if (task.status === TaskStatus.COMPLETED) project.completedTasks += 1
    if (task.status === TaskStatus.DELAYED) project.delayedTasks += 1
    if (task.status === TaskStatus.PENDING) project.pendingTasks += 1
    if (task.status !== TaskStatus.COMPLETED && task.endDate < referenceDate) project.overdueOpenCount += 1
    projectMap.set(task.projectId, project)
  }

  const members = Array.from(memberMap.values())
    .map((member) => ({
      ...member,
      completionRatio: member.totalTasks === 0 ? 0 : roundPercent((member.completedTasks / member.totalTasks) * 100),
    }))
    .sort((a, b) => b.totalTasks - a.totalTasks || a.memberName.localeCompare(b.memberName))

  const projects = Array.from(projectMap.values())
    .map((project) => ({
      ...project,
      completionRatio: project.totalTasks === 0 ? 0 : roundPercent((project.completedTasks / project.totalTasks) * 100),
    }))
    .sort((a, b) => b.totalTasks - a.totalTasks || a.projectName.localeCompare(b.projectName))

  return {
    weekStart: weekStart.toISOString(),
    summary,
    sla,
    members,
    projects,
  }
}

export async function upsertWeeklySnapshot(options: { weekStart?: string | null; generatedById: string }) {
  const report = await buildWeeklyTeamReport({ weekStart: options.weekStart })
  const weekStart = parseWeekStartInput(report.weekStart)
  const summaryJson = toInputJson({
    summary: report.summary,
    sla: report.sla,
  })
  const memberMetricsJson = toInputJson(report.members)
  const projectMetricsJson = toInputJson(report.projects)

  const snapshot = await prisma.teamWeeklySnapshot.upsert({
    where: {
      weekStart,
    },
    update: {
      generatedById: options.generatedById,
      summaryJson,
      memberMetricsJson,
      projectMetricsJson,
      createdAt: new Date(),
    },
    create: {
      weekStart,
      generatedById: options.generatedById,
      summaryJson,
      memberMetricsJson,
      projectMetricsJson,
    },
    include: {
      generatedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return {
    id: snapshot.id,
    weekStart: snapshot.weekStart.toISOString(),
    generatedBy: snapshot.generatedBy,
    createdAt: snapshot.createdAt.toISOString(),
    summary: report.summary,
    sla: report.sla,
  }
}

function parseSnapshotSummary(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      summary: {
        totalTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        delayedTasks: 0,
        pendingTasks: 0,
      },
      sla: {
        inProgressCount: 0,
        delayedCount: 0,
        delayedRate: 0,
        overdueOpenCount: 0,
        overdueOpenRate: 0,
        dueSoon7dCount: 0,
        completionRatio: 0,
      } satisfies SlaMetrics,
    }
  }

  const row = value as { summary?: WeeklyTeamReport["summary"]; sla?: SlaMetrics }
  return {
    summary: row.summary ?? {
      totalTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      delayedTasks: 0,
      pendingTasks: 0,
    },
    sla: row.sla ?? {
      inProgressCount: 0,
      delayedCount: 0,
      delayedRate: 0,
      overdueOpenCount: 0,
      overdueOpenRate: 0,
      dueSoon7dCount: 0,
      completionRatio: 0,
    },
  }
}

export async function getWeeklySnapshots(limit = 12): Promise<TeamWeeklySnapshotItem[]> {
  const rows = await prisma.teamWeeklySnapshot.findMany({
    orderBy: { weekStart: "desc" },
    take: Math.min(Math.max(limit, 1), 52),
    include: {
      generatedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return rows.map((row) => {
    const parsed = parseSnapshotSummary(row.summaryJson)
    return {
      id: row.id,
      weekStart: row.weekStart.toISOString(),
      generatedBy: row.generatedBy,
      createdAt: row.createdAt.toISOString(),
      summary: parsed.summary,
      sla: parsed.sla,
    }
  })
}

export async function getWeeklySnapshotByWeekStart(weekStartInput?: string | null) {
  const weekStart = parseWeekStartInput(weekStartInput)
  const row = await prisma.teamWeeklySnapshot.findUnique({
    where: { weekStart },
    include: {
      generatedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
  if (!row) return null

  const parsedSummary = parseSnapshotSummary(row.summaryJson)
  const members = Array.isArray(row.memberMetricsJson) ? row.memberMetricsJson : []
  const projects = Array.isArray(row.projectMetricsJson) ? row.projectMetricsJson : []

  return {
    weekStart: row.weekStart.toISOString(),
    summary: parsedSummary.summary,
    sla: parsedSummary.sla,
    members,
    projects,
    snapshot: {
      id: row.id,
      generatedBy: row.generatedBy,
      createdAt: row.createdAt.toISOString(),
    },
  }
}

function escapeCsv(value: unknown) {
  const normalized = String(value ?? "")
  if (/[,"\r\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`
  }
  return normalized
}

export function toWeeklyReportCsv(report: WeeklyTeamReport) {
  const lines: string[] = []
  lines.push(["weekStart", report.weekStart].map(escapeCsv).join(","))
  lines.push("")

  lines.push("Summary")
  lines.push(["totalTasks", "inProgressTasks", "completedTasks", "delayedTasks", "pendingTasks"].join(","))
  lines.push(
    [
      report.summary.totalTasks,
      report.summary.inProgressTasks,
      report.summary.completedTasks,
      report.summary.delayedTasks,
      report.summary.pendingTasks,
    ]
      .map(escapeCsv)
      .join(","),
  )
  lines.push("")

  lines.push("SLA")
  lines.push(
    [
      "inProgressCount",
      "delayedCount",
      "delayedRate",
      "overdueOpenCount",
      "overdueOpenRate",
      "dueSoon7dCount",
      "completionRatio",
    ].join(","),
  )
  lines.push(
    [
      report.sla.inProgressCount,
      report.sla.delayedCount,
      report.sla.delayedRate,
      report.sla.overdueOpenCount,
      report.sla.overdueOpenRate,
      report.sla.dueSoon7dCount,
      report.sla.completionRatio,
    ]
      .map(escapeCsv)
      .join(","),
  )
  lines.push("")

  lines.push("Members")
  lines.push(
    [
      "memberId",
      "memberName",
      "role",
      "totalTasks",
      "inProgressTasks",
      "completedTasks",
      "delayedTasks",
      "pendingTasks",
      "overdueOpenCount",
      "completionRatio",
    ].join(","),
  )
  for (const member of report.members) {
    lines.push(
      [
        member.memberId,
        member.memberName,
        member.role,
        member.totalTasks,
        member.inProgressTasks,
        member.completedTasks,
        member.delayedTasks,
        member.pendingTasks,
        member.overdueOpenCount,
        member.completionRatio,
      ]
        .map(escapeCsv)
        .join(","),
    )
  }
  lines.push("")

  lines.push("Projects")
  lines.push(
    [
      "projectId",
      "projectName",
      "totalTasks",
      "inProgressTasks",
      "completedTasks",
      "delayedTasks",
      "pendingTasks",
      "overdueOpenCount",
      "completionRatio",
    ].join(","),
  )
  for (const project of report.projects) {
    lines.push(
      [
        project.projectId,
        project.projectName,
        project.totalTasks,
        project.inProgressTasks,
        project.completedTasks,
        project.delayedTasks,
        project.pendingTasks,
        project.overdueOpenCount,
        project.completionRatio,
      ]
        .map(escapeCsv)
        .join(","),
    )
  }

  return `\uFEFF${lines.join("\r\n")}`
}
