import { NextResponse } from "next/server"
import { TaskStatus } from "@prisma/client"
import { createDueSoonNotifications } from "@/lib/notifications"
import { requireUser, unauthorized } from "@/lib/api"
import { isAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const user = await requireUser()
  if (!user) return unauthorized()

  await createDueSoonNotifications(user.id)

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get("unreadOnly") === "true"

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  const canQuickAct = isAdmin(user.role)
  const assignees = canQuickAct
    ? await prisma.user.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : []

  const unreadCount = await prisma.notification.count({
    where: {
      userId: user.id,
      isRead: false,
    },
  })

  return NextResponse.json({
    notifications: notifications.map((notification) => ({
      ...notification,
      canQuickAct: canQuickAct && Boolean(notification.relatedTaskId),
    })),
    unreadCount,
    quickActions: {
      canQuickAct,
      assignees,
      statuses: Object.values(TaskStatus),
      actionTypes: ["CHANGE_STATUS", "CHANGE_ASSIGNEE"],
    },
  })
}
