import { NextResponse } from "next/server"
import { forbidden, requireUser, unauthorized } from "@/lib/api"
import { canManageProjects } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return unauthorized()
  if (!canManageProjects(user.role)) return forbidden("관리자만 프로젝트 재개 처리를 할 수 있습니다.")

  const { id } = await params
  const before = await prisma.project.findUnique({
    where: { id },
  })
  if (!before) {
    return NextResponse.json({ message: "프로젝트를 찾을 수 없습니다." }, { status: 404 })
  }
  if (!before.completedAt) {
    return NextResponse.json({ message: "완료 처리된 프로젝트가 아닙니다." }, { status: 400 })
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      completedAt: null,
      completedById: null,
      completionNote: null,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "PROJECT_REOPEN",
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
