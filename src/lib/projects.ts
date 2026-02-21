import { TaskStatus } from "@prisma/client"
import type { ProjectHealth, PublicDashboardKpi, PublicProjectOverview, PublicProjectSummary } from "@/types/domain"
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

export async function getProjectSummaries(): Promise<PublicProjectSummary[]> {
  const now = new Date()
  const projects = await prisma.project.findMany({
    where: { isArchived: false },
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
      ...kpi,
      health,
    }
  })
}

export async function getProjectOverview(projectId: string): Promise<PublicProjectOverview | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      isArchived: false,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  })
  if (!project) return null

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      deletedAt: null,
    },
    include: {
      assignee: {
        select: {
          name: true,
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

  return {
    project,
    kpi,
    phaseSummary,
    timeline,
    risks: {
      delayed,
      dueSoon,
    },
    health,
  }
}
