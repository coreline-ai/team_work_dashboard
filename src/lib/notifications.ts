import { addDays, endOfDay } from "date-fns"
import { NotificationType, TaskStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export async function createNotification(input: {
  userId: string
  type: NotificationType
  title: string
  body: string
  relatedTaskId?: string
}) {
  return prisma.notification.create({
    data: input,
  })
}

export async function createBroadcastNotification(input: {
  type: NotificationType
  title: string
  body: string
  relatedTaskId?: string
  excludeUserIds?: string[]
}) {
  const activeUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true },
  })

  const excluded = new Set(input.excludeUserIds ?? [])
  const rows = activeUsers
    .filter((user) => !excluded.has(user.id))
    .map((user) => ({
      userId: user.id,
      type: input.type,
      title: input.title,
      body: input.body,
      relatedTaskId: input.relatedTaskId ?? null,
    }))

  if (rows.length === 0) return { count: 0 }

  return prisma.notification.createMany({
    data: rows,
  })
}

export async function createDueSoonNotifications(userId: string) {
  const now = new Date()
  const dueDate = endOfDay(addDays(now, 2))

  const dueSoonTasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      deletedAt: null,
      status: { not: TaskStatus.COMPLETED },
      endDate: { gte: now, lte: dueDate },
      project: {
        isArchived: false,
        completedAt: null,
      },
    },
    select: { id: true, title: true, endDate: true },
  })

  if (dueSoonTasks.length === 0) return

  for (const task of dueSoonTasks) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: NotificationType.DUE_SOON,
        relatedTaskId: task.id,
      },
    })

    if (existing) continue

    await prisma.notification.create({
      data: {
        userId,
        type: NotificationType.DUE_SOON,
        relatedTaskId: task.id,
        title: "마감 임박 업무",
        body: `${task.title} 업무의 마감일이 ${task.endDate.toLocaleDateString("ko-KR")} 입니다.`,
      },
    })
  }
}
