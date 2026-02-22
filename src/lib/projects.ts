import { TaskStatus } from "@prisma/client"
import { getRecentActivity, getStatusDistribution, getWeeklyMetrics } from "@/lib/dashboard"
import type {
  ProjectCompletionHistoryItem,
  ProjectCompletionSummary,
  PortfolioDashboardOverview,
  ProjectHealth,
  ProjectMemberTaskDetail,
  ProjectMemberWorkload,
  ProjectScheduleLane,
  PublicDashboardKpi,
  PublicProjectOverview,
  PublicProjectSummary,
} from "@/types/domain"
import { prisma } from "@/lib/prisma"

interface HealthInput {
  delayedRate: number
  overdueOpenCount: number
  dueSoonCount: number
}

type TaskLike = {
  status: TaskStatus
  progress: number
  endDate: Date
}

type ProjectTask = {
  id: string
  title: string
  phase: string
  status: TaskStatus
  priority: "HIGH" | "MEDIUM" | "LOW"
  startDate: Date
  endDate: Date
  progress: number
  parentId: string | null
  assigneeId: string
  createdById: string
  updatedById: string
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
  projectId: string
  assignee: {
    id: string
    name: string
    role: "ADMIN" | "MEMBER"
  }
}

export function computeProjectHealth(input: HealthInput): ProjectHealth {
  if (input.delayedRate >= 25 || input.overdueOpenCount >= 5) return "CRITICAL"
  if (input.delayedRate >= 10 || input.dueSoonCount >= 5) return "AT_RISK"
  return "ON_TRACK"
}

function isOpenTask(status: TaskStatus) {
  return status !== TaskStatus.COMPLETED
}

function buildKpi(tasks: TaskLike[]): PublicDashboardKpi {
  const totalTasks = tasks.length
  const inProgressTasks = tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length
  const completedTasks = tasks.filter((task) => task.status === TaskStatus.COMPLETED).length
  const delayedTasks = tasks.filter((task) => task.status === TaskStatus.DELAYED).length
  const pendingTasks = tasks.filter((task) => task.status === TaskStatus.PENDING).length
  const overallProgress =
    totalTasks === 0 ? 0 : Math.round(tasks.reduce((acc, item) => acc + item.progress, 0) / totalTasks)

  return {
    totalTasks,
    inProgressTasks,
    completedTasks,
    delayedTasks,
    pendingTasks,
    overallProgress,
  }
}

function buildHealth(tasks: TaskLike[], now: Date) {
  const dueSoonEnd = new Date(now)
  dueSoonEnd.setDate(dueSoonEnd.getDate() + 7)

  const delayedCount = tasks.filter((task) => task.status === TaskStatus.DELAYED).length
  const delayedRate = tasks.length === 0 ? 0 : Math.round((delayedCount / tasks.length) * 100)
  const overdueOpenCount = tasks.filter((task) => isOpenTask(task.status) && task.endDate < now).length
  const dueSoonCount = tasks.filter(
    (task) => isOpenTask(task.status) && task.endDate >= now && task.endDate <= dueSoonEnd,
  ).length

  return computeProjectHealth({ delayedRate, overdueOpenCount, dueSoonCount })
}

function computeDepthById(
  id: string,
  parentMap: Map<string, string | null>,
  depthMap: Map<string, number>,
): number {
  if (depthMap.has(id)) return depthMap.get(id) ?? 0

  const parentId = parentMap.get(id)
  if (!parentId || !parentMap.has(parentId)) {
    depthMap.set(id, 0)
    return 0
  }

  const depth = computeDepthById(parentId, parentMap, depthMap) + 1
  depthMap.set(id, depth)
  return depth
}

function buildLane(id: string, label: string, laneType: "PHASE" | "MEMBER", tasks: ProjectTask[]): ProjectScheduleLane {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === TaskStatus.COMPLETED).length
  const delayedTasks = tasks.filter((task) => task.status === TaskStatus.DELAYED).length
  const progress = totalTasks === 0 ? 0 : Math.round(tasks.reduce((acc, task) => acc + task.progress, 0) / totalTasks)

  const startDate = tasks.reduce(
    (min, task) => (task.startDate < min ? task.startDate : min),
    tasks[0]?.startDate ?? new Date(),
  )
  const endDate = tasks.reduce(
    (max, task) => (task.endDate > max ? task.endDate : max),
    tasks[0]?.endDate ?? new Date(),
  )

  return {
    id,
    label,
    laneType,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    totalTasks,
    completedTasks,
    delayedTasks,
    progress,
  }
}

export async function getProjectSummaries(options?: { includeCompleted?: boolean }): Promise<PublicProjectSummary[]> {
  const now = new Date()
  const includeCompleted = options?.includeCompleted === true
  const projects = await prisma.project.findMany({
    where: {
      isArchived: false,
      ...(includeCompleted ? {} : { completedAt: null }),
    },
    orderBy: { createdAt: "asc" },
    include: {
      tasks: {
        where: { deletedAt: null },
        select: {
          status: true,
          progress: true,
          endDate: true,
        },
      },
    },
  })

  return projects.map((project) => {
    const kpi = buildKpi(project.tasks)
    const health = buildHealth(project.tasks, now)

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      completedAt: project.completedAt?.toISOString() ?? null,
      completedById: project.completedById ?? null,
      completionNote: project.completionNote ?? null,
      ...kpi,
      health,
    }
  })
}

export async function getPortfolioOverview(): Promise<PortfolioDashboardOverview> {
  const [kpi, weekly, statusDistribution, recentActivity, projects] = await Promise.all([
    (async () => {
      const tasks = await prisma.task.findMany({
        where: { deletedAt: null, project: { isArchived: false, completedAt: null } },
        select: { status: true, progress: true, endDate: true },
      })
      return buildKpi(tasks)
    })(),
    getWeeklyMetrics(),
    getStatusDistribution(),
    getRecentActivity(),
    getProjectSummaries(),
  ])

  const projectHealth = projects.map((project) => ({
    id: project.id,
    name: project.name,
    totalTasks: project.totalTasks,
    delayedTasks: project.delayedTasks,
    overallProgress: project.overallProgress,
    health: project.health,
  }))

  return {
    kpi,
    weekly,
    statusDistribution,
    recentActivity,
    projectHealth,
  }
}

export async function getProjectOverview(projectId: string): Promise<PublicProjectOverview | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      isArchived: false,
      completedAt: null,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  })
  if (!project) return null

  const tasks: ProjectTask[] = await prisma.task.findMany({
    where: {
      projectId,
      deletedAt: null,
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: [{ phase: "asc" }, { createdAt: "asc" }],
  })

  const now = new Date()
  const dueSoonEnd = new Date(now)
  dueSoonEnd.setDate(dueSoonEnd.getDate() + 7)

  const kpi = buildKpi(tasks)
  const health = buildHealth(tasks, now)

  const phaseMap = new Map<string, { total: number; completed: number; delayed: number }>()
  const timelineMap = new Map<string, { startDate: Date; endDate: Date; totalTasks: number; completedTasks: number }>()
  const laneByPhase = new Map<string, ProjectTask[]>()
  const laneByMember = new Map<string, { label: string; tasks: ProjectTask[] }>()

  const parentMap = new Map(tasks.map((task) => [task.id, task.parentId]))
  const depthMap = new Map<string, number>()

  const memberWorkloadsMap = new Map<
    string,
    {
      memberId: string
      memberName: string
      role: "ADMIN" | "MEMBER"
      tasks: ProjectMemberTaskDetail[]
      totalTasks: number
      inProgressTasks: number
      completedTasks: number
      delayedTasks: number
      pendingTasks: number
    }
  >()

  for (const task of tasks) {
    const phaseCurrent = phaseMap.get(task.phase) ?? { total: 0, completed: 0, delayed: 0 }
    phaseCurrent.total += 1
    if (task.status === TaskStatus.COMPLETED) phaseCurrent.completed += 1
    if (task.status === TaskStatus.DELAYED) phaseCurrent.delayed += 1
    phaseMap.set(task.phase, phaseCurrent)

    const timelineCurrent = timelineMap.get(task.phase)
    if (!timelineCurrent) {
      timelineMap.set(task.phase, {
        startDate: task.startDate,
        endDate: task.endDate,
        totalTasks: 1,
        completedTasks: task.status === TaskStatus.COMPLETED ? 1 : 0,
      })
    } else {
      timelineCurrent.startDate = task.startDate < timelineCurrent.startDate ? task.startDate : timelineCurrent.startDate
      timelineCurrent.endDate = task.endDate > timelineCurrent.endDate ? task.endDate : timelineCurrent.endDate
      timelineCurrent.totalTasks += 1
      if (task.status === TaskStatus.COMPLETED) timelineCurrent.completedTasks += 1
      timelineMap.set(task.phase, timelineCurrent)
    }

    const phaseLaneTasks = laneByPhase.get(task.phase) ?? []
    phaseLaneTasks.push(task)
    laneByPhase.set(task.phase, phaseLaneTasks)

    const memberLane = laneByMember.get(task.assignee.id) ?? { label: task.assignee.name, tasks: [] }
    memberLane.tasks.push(task)
    laneByMember.set(task.assignee.id, memberLane)

    const depth = computeDepthById(task.id, parentMap, depthMap)
    const memberCurrent =
      memberWorkloadsMap.get(task.assignee.id) ??
      {
        memberId: task.assignee.id,
        memberName: task.assignee.name,
        role: task.assignee.role,
        tasks: [],
        totalTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        delayedTasks: 0,
        pendingTasks: 0,
      }

    memberCurrent.totalTasks += 1
    if (task.status === TaskStatus.IN_PROGRESS) memberCurrent.inProgressTasks += 1
    if (task.status === TaskStatus.COMPLETED) memberCurrent.completedTasks += 1
    if (task.status === TaskStatus.DELAYED) memberCurrent.delayedTasks += 1
    if (task.status === TaskStatus.PENDING) memberCurrent.pendingTasks += 1

    memberCurrent.tasks.push({
      id: task.id,
      title: task.title,
      phase: task.phase,
      status: task.status,
      priority: task.priority,
      startDate: task.startDate.toISOString(),
      endDate: task.endDate.toISOString(),
      progress: task.progress,
      parentId: task.parentId,
      depth,
    })

    memberWorkloadsMap.set(task.assignee.id, memberCurrent)
  }

  const phaseSummary = Array.from(phaseMap.entries()).map(([phase, data]) => ({
    phase,
    total: data.total,
    completed: data.completed,
    delayed: data.delayed,
    progress: data.total === 0 ? 0 : Math.round((data.completed / data.total) * 100),
  }))

  const timeline = Array.from(timelineMap.entries())
    .map(([phase, data]) => ({
      phase,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      totalTasks: data.totalTasks,
      completedTasks: data.completedTasks,
    }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  const delayed = tasks
    .filter((task) => task.status === TaskStatus.DELAYED)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.title,
      assigneeName: task.assignee.name,
      endDate: task.endDate.toISOString(),
      status: task.status,
      priority: task.priority,
    }))

  const dueSoon = tasks
    .filter((task) => isOpenTask(task.status) && task.endDate >= now && task.endDate <= dueSoonEnd)
    .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.title,
      assigneeName: task.assignee.name,
      endDate: task.endDate.toISOString(),
      status: task.status,
      priority: task.priority,
    }))

  const updatedAtById = new Map(tasks.map((task) => [task.id, task.updatedAt.getTime()]))

  const memberWorkloads: ProjectMemberWorkload[] = Array.from(memberWorkloadsMap.values())
    .map((member) => ({
      memberId: member.memberId,
      memberName: member.memberName,
      role: member.role,
      totalTasks: member.totalTasks,
      inProgressTasks: member.inProgressTasks,
      completedTasks: member.completedTasks,
      delayedTasks: member.delayedTasks,
      pendingTasks: member.pendingTasks,
      completionRate: member.totalTasks === 0 ? 0 : Math.round((member.completedTasks / member.totalTasks) * 100),
      tasks: member.tasks.sort((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth
        const startDiff = new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        if (startDiff !== 0) return startDiff
        return (updatedAtById.get(b.id) ?? 0) - (updatedAtById.get(a.id) ?? 0)
      }),
    }))
    .sort((a, b) => b.totalTasks - a.totalTasks || a.memberName.localeCompare(b.memberName))

  const projectStartDate = tasks.length > 0
    ? tasks.reduce((min, task) => (task.startDate < min ? task.startDate : min), tasks[0].startDate)
    : now
  const projectEndDate = tasks.length > 0
    ? tasks.reduce((max, task) => (task.endDate > max ? task.endDate : max), tasks[0].endDate)
    : now
  const openTasks = tasks.filter((task) => isOpenTask(task.status))
  const forecastCompletionDate = openTasks.length > 0
    ? openTasks.reduce((max, task) => (task.endDate > max ? task.endDate : max), openTasks[0].endDate)
    : projectEndDate

  const phaseLanes = Array.from(laneByPhase.entries())
    .map(([phase, phaseTasks]) => buildLane(`phase:${phase}`, phase, "PHASE", phaseTasks))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  const memberLanes = Array.from(laneByMember.entries())
    .map(([memberId, memberLane]) => buildLane(`member:${memberId}`, memberLane.label, "MEMBER", memberLane.tasks))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  return {
    project,
    kpi,
    phaseSummary,
    timeline,
    risks: {
      delayed,
      dueSoon,
    },
    memberWorkloads,
    schedule: {
      projectStartDate: projectStartDate.toISOString(),
      projectEndDate: projectEndDate.toISOString(),
      forecastCompletionDate: forecastCompletionDate.toISOString(),
      today: now.toISOString(),
      phaseLanes,
      memberLanes,
    },
    health,
  }
}

export async function getCompletedProjectManagementData(): Promise<{
  projects: ProjectCompletionSummary[]
  history: ProjectCompletionHistoryItem[]
}> {
  const projects = await prisma.project.findMany({
    where: {
      isArchived: false,
      completedAt: { not: null },
    },
    orderBy: { completedAt: "desc" },
    include: {
      completedBy: {
        select: { id: true, name: true },
      },
      tasks: {
        where: { deletedAt: null },
        select: {
          status: true,
          progress: true,
        },
      },
    },
  })

  const projectIds = projects.map((project) => project.id)
  const rawHistory = projectIds.length
    ? await prisma.auditLog.findMany({
        where: {
          entityType: "PROJECT",
          entityId: { in: projectIds },
          action: { in: ["PROJECT_COMPLETE", "PROJECT_REOPEN"] },
        },
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: { id: true, name: true },
          },
        },
      })
    : []

  const summaries: ProjectCompletionSummary[] = projects.map((project) => {
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter((task) => task.status === TaskStatus.COMPLETED).length
    const overallProgress =
      totalTasks === 0 ? 0 : Math.round(project.tasks.reduce((sum, task) => sum + task.progress, 0) / totalTasks)

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      completedAt: project.completedAt?.toISOString() ?? new Date().toISOString(),
      completedBy: project.completedBy ? { id: project.completedBy.id, name: project.completedBy.name } : null,
      completionNote: project.completionNote,
      totalTasks,
      completedTasks,
      overallProgress,
    }
  })

  const history: ProjectCompletionHistoryItem[] = rawHistory.map((item) => ({
    id: item.id,
    projectId: item.entityId,
    action: item.action as "PROJECT_COMPLETE" | "PROJECT_REOPEN",
    actor: item.actor ? { id: item.actor.id, name: item.actor.name } : null,
    createdAt: item.createdAt.toISOString(),
    before: item.beforeJson ? safeJsonParse(item.beforeJson) : null,
    after: item.afterJson ? safeJsonParse(item.afterJson) : null,
  }))

  return { projects: summaries, history }
}

function safeJsonParse(value: string): Record<string, unknown> | null {
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return null
  }
}
