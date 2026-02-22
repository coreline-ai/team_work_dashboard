import { TaskStatus, Prisma, type User } from "@prisma/client"
import { startOfWeek } from "date-fns"
import { isAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

export function getTaskScopeWhere(user?: Pick<User, "id" | "role"> | null): Prisma.TaskWhereInput {
  if (!user) {
    return { deletedAt: null, project: { isArchived: false } }
  }
  if (isAdmin(user.role)) return { deletedAt: null, project: { isArchived: false } }
  return {
    deletedAt: null,
    project: { isArchived: false },
    OR: [{ assigneeId: user.id }, { createdById: user.id }],
  }
}

export async function getKpi(user?: Pick<User, "id" | "role"> | null) {
  const where = getTaskScopeWhere(user)
  const tasks = await prisma.task.findMany({
    where,
    select: {
      status: true,
      progress: true,
    },
  })

  const total = tasks.length
  const completed = tasks.filter((task) => task.status === TaskStatus.COMPLETED).length
  const inProgress = tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length
  const delayed = tasks.filter((task) => task.status === TaskStatus.DELAYED).length
  const pending = tasks.filter((task) => task.status === TaskStatus.PENDING).length
  const averageProgress = total === 0 ? 0 : Math.round(tasks.reduce((acc, item) => acc + item.progress, 0) / total)

  return {
    totalTasks: total,
    inProgressTasks: inProgress,
    completedTasks: completed,
    delayedTasks: delayed,
    pendingTasks: pending,
    overallProgress: averageProgress,
  }
}

export async function getWeeklyMetrics(user?: Pick<User, "id" | "role"> | null) {
  const where = getTaskScopeWhere(user)
  const tasks = await prisma.task.findMany({
    where,
    select: {
      startDate: true,
      status: true,
      progress: true,
    },
  })

  const weekMap = new Map<string, { planned: number; completed: number; progressSum: number }>()
  for (const task of tasks) {
    const weekKey = `${startOfWeek(task.startDate, { weekStartsOn: 1 }).toISOString().slice(0, 10)}`
    const current = weekMap.get(weekKey) ?? { planned: 0, completed: 0, progressSum: 0 }
    current.planned += 1
    if (task.status === TaskStatus.COMPLETED) current.completed += 1
    current.progressSum += task.progress
    weekMap.set(weekKey, current)
  }

  return Array.from(weekMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([week, data], index) => ({
      name: `${index + 1}주차`,
      planned: data.planned,
      completed: data.completed,
      resource: data.planned === 0 ? 0 : Math.round(data.progressSum / data.planned),
      weekStart: week,
    }))
}

export async function getStatusDistribution(user?: Pick<User, "id" | "role"> | null) {
  const where = getTaskScopeWhere(user)
  const tasks = await prisma.task.findMany({
    where,
    select: { status: true },
  })

  const completed = tasks.filter((task) => task.status === TaskStatus.COMPLETED).length
  const inProgress = tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length
  const pending = tasks.filter((task) => task.status === TaskStatus.PENDING).length
  const delayed = tasks.filter((task) => task.status === TaskStatus.DELAYED).length

  return [
    { name: "완료", value: completed, color: "#10b981" },
    { name: "진행중", value: inProgress, color: "#3b82f6" },
    { name: "대기", value: pending, color: "#f59e0b" },
    { name: "지연", value: delayed, color: "#ef4444" },
  ]
}

export async function getRecentActivity(user?: Pick<User, "id" | "role"> | null) {
  const where = {
    ...getTaskScopeWhere(user),
    parentId: null,
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
  })

  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    projectId: task.projectId,
    phase: task.phase,
    status: task.status,
    progress: task.progress,
    startDate: task.startDate.toISOString(),
    endDate: task.endDate.toISOString(),
    assignee: task.assignee,
  }))
}
