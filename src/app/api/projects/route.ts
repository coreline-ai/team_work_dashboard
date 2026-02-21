import { NextResponse } from "next/server"
import { z } from "zod"
import { forbidden, requireUser, unauthorized } from "@/lib/api"
import { canManageProjects } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().nullable(),
})

export async function GET(req: Request) {
  const currentUser = await requireUser()
  if (!currentUser) return unauthorized()
  if (!canManageProjects(currentUser.role)) return forbidden("관리자만 조회할 수 있습니다.")

  const { searchParams } = new URL(req.url)
  const includeArchived = searchParams.get("includeArchived") === "true"

  const projects = await prisma.project.findMany({
    where: includeArchived ? {} : { isArchived: false },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
      tasks: {
        where: { deletedAt: null },
        select: { id: true },
      },
    },
  })

  return NextResponse.json({
    projects: projects.map(({ tasks, ...project }) => ({
      ...project,
      taskCount: tasks.length,
    })),
  })
}

export async function POST(req: Request) {
  const currentUser = await requireUser()
  if (!currentUser) return unauthorized()
  if (!canManageProjects(currentUser.role)) return forbidden("관리자만 프로젝트를 생성할 수 있습니다.")

  const body = await req.json().catch(() => null)
  const parsed = createProjectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "유효하지 않은 요청입니다.", details: parsed.error.flatten() }, { status: 400 })
  }

  const created = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      createdById: currentUser.id,
      isArchived: false,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorUserId: currentUser.id,
      action: "PROJECT_CREATE",
      entityType: "PROJECT",
      entityId: created.id,
      afterJson: JSON.stringify({
        name: created.name,
        isArchived: created.isArchived,
      }),
    },
  })

  return NextResponse.json({ project: created }, { status: 201 })
}
