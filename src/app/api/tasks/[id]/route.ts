import { NextResponse } from "next/server"
import { TaskPriority, TaskStatus } from "@prisma/client"
import { z } from "zod"
import { forbidden, requireUser, unauthorized } from "@/lib/api"
import { createNotification } from "@/lib/notifications"
import { canEditTask } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const updateTaskSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional().nullable(),
  phase: z.string().min(1).max(40).optional(),
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(TaskPriority).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  parentId: z.string().optional().nullable(),
  assigneeId: z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await requireUser()
  if (!currentUser) return unauthorized()

  const { id } = await params
  const existing = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true } },
    },
  })
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ message: "업무를 찾을 수 없습니다." }, { status: 404 })
  }
  if (!canEditTask(currentUser.role, currentUser.id, existing)) {
    return forbidden("수정 권한이 없습니다.")
  }

  const body = await req.json().catch(() => null)
  const parsed = updateTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "유효하지 않은 요청입니다.", details: parsed.error.flatten() }, { status: 400 })
  }

  if (parsed.data.parentId && parsed.data.parentId === existing.id) {
    return NextResponse.json({ message: "자기 자신을 부모로 지정할 수 없습니다." }, { status: 400 })
  }

  const updated = await prisma.task.update({
    where: { id: existing.id },
    data: {
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      updatedById: currentUser.id,
    },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
    },
  })

  if (parsed.data.assigneeId && parsed.data.assigneeId !== existing.assigneeId) {
    await createNotification({
      userId: parsed.data.assigneeId,
      type: "ASSIGNED",
      title: "업무가 새로 배정되었습니다.",
      body: `${updated.title} 업무 담당자로 지정되었습니다.`,
      relatedTaskId: updated.id,
    })
  }

  if (parsed.data.status && parsed.data.status !== existing.status) {
    await createNotification({
      userId: updated.assigneeId,
      type: "STATUS_CHANGED",
      title: "업무 상태가 변경되었습니다.",
      body: `${updated.title} 상태가 ${updated.status}로 변경되었습니다.`,
      relatedTaskId: updated.id,
    })
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: currentUser.id,
      action: "TASK_UPDATE",
      entityType: "TASK",
      entityId: updated.id,
      beforeJson: JSON.stringify({
        title: existing.title,
        status: existing.status,
        assigneeId: existing.assigneeId,
      }),
      afterJson: JSON.stringify({
        title: updated.title,
        status: updated.status,
        assigneeId: updated.assigneeId,
      }),
    },
  })

  return NextResponse.json({ task: updated })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await requireUser()
  if (!currentUser) return unauthorized()

  const { id } = await params
  const existing = await prisma.task.findUnique({
    where: { id },
  })
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ message: "업무를 찾을 수 없습니다." }, { status: 404 })
  }
  if (!canEditTask(currentUser.role, currentUser.id, existing)) {
    return forbidden("삭제 권한이 없습니다.")
  }

  const deleted = await prisma.task.update({
    where: { id: existing.id },
    data: {
      deletedAt: new Date(),
      updatedById: currentUser.id,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorUserId: currentUser.id,
      action: "TASK_DELETE_SOFT",
      entityType: "TASK",
      entityId: deleted.id,
      beforeJson: JSON.stringify({ deletedAt: existing.deletedAt }),
      afterJson: JSON.stringify({ deletedAt: deleted.deletedAt }),
    },
  })

  return NextResponse.json({ ok: true })
}
