import { NextResponse } from "next/server"
import { z } from "zod"
import { forbidden, requireUser, unauthorized } from "@/lib/api"
import { canManageProjects } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  isArchived: z.boolean().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await requireUser()
  if (!currentUser) return unauthorized()
  if (!canManageProjects(currentUser.role)) return forbidden("관리자만 프로젝트를 수정할 수 있습니다.")

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = updateProjectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "유효하지 않은 요청입니다.", details: parsed.error.flatten() }, { status: 400 })
  }

  const before = await prisma.project.findUnique({ where: { id } })
  if (!before) {
    return NextResponse.json({ message: "프로젝트를 찾을 수 없습니다." }, { status: 404 })
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      isArchived: parsed.data.isArchived,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorUserId: currentUser.id,
      action: "PROJECT_UPDATE",
      entityType: "PROJECT",
      entityId: updated.id,
      beforeJson: JSON.stringify({
        name: before.name,
        description: before.description,
        isArchived: before.isArchived,
      }),
      afterJson: JSON.stringify({
        name: updated.name,
        description: updated.description,
        isArchived: updated.isArchived,
      }),
    },
  })

  return NextResponse.json({ project: updated })
}
