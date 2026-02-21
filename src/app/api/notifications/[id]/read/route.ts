import { NextResponse } from "next/server"
import { forbidden, requireUser, unauthorized } from "@/lib/api"
import { prisma } from "@/lib/prisma"

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const { id } = await params
  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification) {
    return NextResponse.json({ message: "알림을 찾을 수 없습니다." }, { status: 404 })
  }
  if (notification.userId !== user.id) {
    return forbidden("해당 알림에 접근할 수 없습니다.")
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  })

  return NextResponse.json({ notification: updated })
}
