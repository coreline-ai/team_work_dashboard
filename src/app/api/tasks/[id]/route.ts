import { NextResponse } from "next/server"
import { TaskPriority, TaskStatus } from "@prisma/client"
import { z } from "zod"
import { forbidden, requireUser, unauthorized } from "@/lib/api"
import { createBroadcastNotification } from "@/lib/notifications"
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

function toComparable(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  if (value === null || value === undefined) return value
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function buildChangeSummary(before: Record<string, unknown>, after: Record<string, unknown>) {
  const keys = Object.keys(after)
  const changed = keys.filter((key) => toComparable(before[key]) !== toComparable(after[key]))
  return changed.map((key) => ({
    field: key,
    before: before[key],
    after: after[key],
  }))
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await requireUser()
  if (!currentUser) return unauthorized()

  const { id } = await params
  const existing = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, completedAt: true } },
    },
  })
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ message: "업무를 찾을 수 없습니다." }, { status: 404 })
  }
  if (existing.project.completedAt) {
    return NextResponse.json({ message: "완료된 프로젝트의 업무는 프로젝트 재개 후 수정하세요." }, { status: 400 })
  }
  if (!canEditTask(currentUser.role, currentUser.id, existing)) {
    return forbidden("수정 권한이 없습니다.")
  }

  const body = await req.json().catch(() => null)
  const parsed = updateTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "유효하지 않은 요청입니다.", details: parsed.error.flatten() }, { status: 400 })
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ message: "변경할 필드가 없습니다." }, { status: 400 })
  }

  if (parsed.data.parentId && parsed.data.parentId === existing.id) {
    return NextResponse.json({ message: "자기 자신을 부모로 지정할 수 없습니다." }, { status: 400 })
  }

  if (parsed.data.parentId) {
    const parent = await prisma.task.findUnique({
      where: { id: parsed.data.parentId },
      select: { id: true, projectId: true, deletedAt: true },
    })
    if (!parent || parent.deletedAt) {
      return NextResponse.json({ message: "부모 업무를 찾을 수 없습니다." }, { status: 400 })
    }
    if (parent.projectId !== existing.projectId) {
      return NextResponse.json({ message: "부모 업무와 같은 프로젝트에 있어야 합니다." }, { status: 400 })
    }
  }

  const beforeSnapshot: Record<string, unknown> = {
    title: existing.title,
    description: existing.description,
    phase: existing.phase,
    status: existing.status,
    priority: existing.priority,
    startDate: existing.startDate,
    endDate: existing.endDate,
    progress: existing.progress,
    parentId: existing.parentId,
    assigneeId: existing.assigneeId,
  }

  const updateData = {
    ...parsed.data,
    startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
    endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
    updatedById: currentUser.id,
  }

  const updated = await prisma.task.update({
    where: { id: existing.id },
    data: updateData,
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      project: { select: { id: true, name: true } },
    },
  })

  const afterSnapshot: Record<string, unknown> = {
    title: updated.title,
    description: updated.description,
    phase: updated.phase,
    status: updated.status,
    priority: updated.priority,
    startDate: updated.startDate,
    endDate: updated.endDate,
    progress: updated.progress,
    parentId: updated.parentId,
    assigneeId: updated.assigneeId,
  }

  const changes = buildChangeSummary(beforeSnapshot, afterSnapshot)
  const changedFieldsText = changes.map((item) => item.field).join(", ")

  await createBroadcastNotification({
    type: "TASK_UPDATED",
    title: "업무가 수정되었습니다.",
    body: `${currentUser.name}님이 [${updated.project.name}] ${updated.title} 업무를 수정했습니다. 변경: ${changedFieldsText || "기타"}`,
    relatedTaskId: updated.id,
  })

  if (parsed.data.status && parsed.data.status !== existing.status) {
    await createBroadcastNotification({
      type: "STATUS_CHANGED",
      title: "업무 상태가 변경되었습니다.",
      body: `${currentUser.name}님이 ${updated.title} 상태를 ${existing.status} → ${updated.status}로 변경했습니다.`,
      relatedTaskId: updated.id,
    })
  }

  if (parsed.data.assigneeId && parsed.data.assigneeId !== existing.assigneeId) {
    await createBroadcastNotification({
      type: "ASSIGNEE_CHANGED",
      title: "업무 담당자가 변경되었습니다.",
      body: `${currentUser.name}님이 ${updated.title} 담당자를 ${existing.assignee.name} → ${updated.assignee.name}로 변경했습니다.`,
      relatedTaskId: updated.id,
    })
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: currentUser.id,
      action: "TASK_UPDATE",
      entityType: "TASK",
      entityId: updated.id,
      beforeJson: JSON.stringify(beforeSnapshot),
      afterJson: JSON.stringify({
        ...afterSnapshot,
        changedFields: changes,
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
    include: {
      project: { select: { id: true, name: true, completedAt: true } },
    },
  })
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ message: "업무를 찾을 수 없습니다." }, { status: 404 })
  }
  if (existing.project.completedAt) {
    return NextResponse.json({ message: "완료된 프로젝트의 업무는 프로젝트 재개 후 삭제하세요." }, { status: 400 })
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

  await createBroadcastNotification({
    type: "TASK_DELETED",
    title: "업무가 삭제되었습니다.",
    body: `${currentUser.name}님이 [${existing.project.name}] ${existing.title} 업무를 삭제했습니다.`,
    relatedTaskId: deleted.id,
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
