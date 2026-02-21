import { NextResponse } from "next/server"
import { createDueSoonNotifications } from "@/lib/notifications"
import { requireUser, unauthorized } from "@/lib/api"
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

  const unreadCount = await prisma.notification.count({
    where: {
      userId: user.id,
      isRead: false,
    },
  })

  return NextResponse.json({ notifications, unreadCount })
}
