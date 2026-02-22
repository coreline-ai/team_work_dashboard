import { NextResponse } from "next/server"
import { z } from "zod"
import { forbidden, requireUser, unauthorized } from "@/lib/api"
import { canManageProjects } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const bodySchema = z.object({
  note: z.string().trim().max(400).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return unauthorized()
  if (!canManageProjects(user.role)) return forbidden("관리자만 프로젝트 완료 처리를 할 수 있습니다.")

  const body = await req.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "유효하지 않은 요청입니다.", details: parsed.error.flatten() }, { status: 400 })
  }

  const { id } = await params
  const before = await prisma.project.findUnique({
    where: { id },
  })
  if (!before) {
    return NextResponse.json({ message: "프로젝트를 찾을 수 없습니다." }, { status: 404 })
  }
  if (before.isArchived) {
    return NextResponse.json({ message: "아카이브 프로젝트는 완료 처리할 수 없습니다." }, { status: 400 })
  }
  if (before.completedAt) {
    return NextResponse.json({ message: "이미 완료된 프로젝트입니다." }, { status: 400 })
  }

  const completedAt = new Date()
  const updated = await prisma.project.update({
    where: { id },
    data: {
      completedAt,
      completedById: user.id,
      completionNote: parsed.data.note || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "PROJECT_COMPLETE",
      entityType: "PROJECT",
      entityId: id,
      beforeJson: JSON.stringify({
        completedAt: before.completedAt,
        completedById: before.completedById,
        completionNote: before.completionNote,
      }),
      afterJson: JSON.stringify({
        completedAt: updated.completedAt,
        completedById: updated.completedById,
        completionNote: updated.completionNote,
      }),
    },
  })

  return NextResponse.json({ project: updated })
}
