import { NextResponse } from "next/server"
import { requireUser, unauthorized } from "@/lib/api"
import { prisma } from "@/lib/prisma"

export async function PATCH() {
  const user = await requireUser()
  if (!user) return unauthorized()

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      isRead: false,
    },
    data: { isRead: true },
  })

  return NextResponse.json({ ok: true })
}
