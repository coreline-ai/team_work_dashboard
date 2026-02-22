import { subDays } from "date-fns"
import { NextResponse } from "next/server"
import { requireUser, unauthorized } from "@/lib/api"
import { prisma } from "@/lib/prisma"

function safeJsonParse(value?: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function GET() {
  const user = await requireUser()
  if (!user) return unauthorized()

  const sevenDaysAgo = subDays(new Date(), 7)

  const [unreadNotifications, myActivityCount7d, recentLogs] = await Promise.all([
    prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    }),
    prisma.auditLog.count({
      where: {
        actorUserId: user.id,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        actorUserId: user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    }),
  ])

  return NextResponse.json({
    account: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    },
    settings: {
      locale: user.settings?.locale ?? "ko-KR",
      timezone: user.settings?.timezone ?? "Asia/Seoul",
      defaultStartPage: user.settings?.defaultStartPage ?? "/",
    },
    summary: {
      unreadNotifications,
      myActivityCount7d,
      myRecentActions: recentLogs.map((item) => ({
        id: item.id,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        actor: item.actor
          ? {
              id: item.actor.id,
              name: item.actor.name,
              role: item.actor.role,
            }
          : null,
        before: safeJsonParse(item.beforeJson),
        after: safeJsonParse(item.afterJson),
        createdAt: item.createdAt.toISOString(),
      })),
    },
  })
}
