import { TaskStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"
import { forbidden, requireUser, unauthorized } from "@/lib/api"
import { createBroadcastNotification } from "@/lib/notifications"
import { isAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const bodySchema = z.discriminatedUnion("actionType", [
  z.object({
    actionType: z.literal("CHANGE_STATUS"),
    status: z.nativeEnum(TaskStatus),
  }),
  z.object({
    actionType: z.literal("CHANGE_ASSIGNEE"),
    assigneeId: z.string().min(1),
  }),
])

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return unauthorized()
  if (!isAdmin(user.role)) return forbidden("관리자만 알림 퀵액션을 사용할 수 있습니다.")

  const { id } = await params
  const notification = await prisma.notification.findUnique({
    where: { id },
  })
  if (!notification) {
    return NextResponse.json({ message: "Notification not found" }, { status: 404 })
  }
  if (notification.userId !== user.id) {
    return forbidden("해당 알림에 접근할 수 없습니다.")
  }
  if (!notification.relatedTaskId) {
    return NextResponse.json({ message: "This notification has no actionable task." }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request body", details: parsed.error.flatten() }, { status: 400 })
  }

  const task = await prisma.task.findUnique({
    where: { id: notification.relatedTaskId },
    include: {
      assignee: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, isArchived: true, completedAt: true } },
    },
  })
  if (!task || task.deletedAt) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 })
  }
  if (task.project.isArchived || task.project.completedAt) {
    return NextResponse.json({ message: "Cannot quick-act on archived/completed project task." }, { status: 400 })
  }

  let updatedTask = task
  let actionSummary = ""
  let before: Record<string, unknown> = {}
  let after: Record<string, unknown> = {}

  if (parsed.data.actionType === "CHANGE_STATUS") {
    if (task.status === parsed.data.status) {
      actionSummary = `status unchanged: ${task.status}`
    } else {
      updatedTask = await prisma.task.update({
        where: { id: task.id },
        data: {
          status: parsed.data.status,
          updatedById: user.id,
        },
        include: {
          assignee: { select: { id: true, name: true } },
          project: { select: { id: true, name: true, isArchived: true, completedAt: true } },
        },
      })
      actionSummary = `status: ${task.status} -> ${updatedTask.status}`
      before = { status: task.status }
      after = { status: updatedTask.status }

      await createBroadcastNotification({
        type: "STATUS_CHANGED",
        title: "업무 상태가 변경되었습니다.",
        body: `${user.name}님이 ${updatedTask.title}의 상태를 ${task.status}에서 ${updatedTask.status}(으)로 변경했습니다.`,
        relatedTaskId: updatedTask.id,
      })
    }
  } else {
    if (task.assigneeId === parsed.data.assigneeId) {
      actionSummary = `assignee unchanged: ${task.assigneeId}`
    } else {
      const nextAssignee = await prisma.user.findFirst({
        where: { id: parsed.data.assigneeId, isActive: true },
        select: { id: true, name: true },
      })
      if (!nextAssignee) {
        return NextResponse.json({ message: "Assignee not found or inactive." }, { status: 400 })
      }

      updatedTask = await prisma.task.update({
        where: { id: task.id },
        data: {
          assigneeId: nextAssignee.id,
          updatedById: user.id,
        },
        include: {
          assignee: { select: { id: true, name: true } },
          project: { select: { id: true, name: true, isArchived: true, completedAt: true } },
        },
      })
      actionSummary = `assignee: ${task.assignee.name} -> ${updatedTask.assignee.name}`
      before = { assigneeId: task.assigneeId, assigneeName: task.assignee.name }
      after = { assigneeId: updatedTask.assigneeId, assigneeName: updatedTask.assignee.name }

      await createBroadcastNotification({
        type: "ASSIGNEE_CHANGED",
        title: "업무 담당자가 변경되었습니다.",
        body: `${user.name}님이 ${updatedTask.title}의 담당자를 ${task.assignee.name}에서 ${updatedTask.assignee.name}(으)로 변경했습니다.`,
        relatedTaskId: updatedTask.id,
      })
    }
  }

  await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true },
  })

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "NOTIFICATION_QUICK_ACTION",
      entityType: "TASK",
      entityId: updatedTask.id,
      beforeJson: Object.keys(before).length > 0 ? JSON.stringify(before) : null,
      afterJson: JSON.stringify({
        ...after,
        actionType: parsed.data.actionType,
        actionSummary,
        sourceNotificationId: notification.id,
      }),
    },
  })

  return NextResponse.json({
    ok: true,
    actionSummary,
    task: {
      id: updatedTask.id,
      status: updatedTask.status,
      assigneeId: updatedTask.assigneeId,
      assigneeName: updatedTask.assignee.name,
    },
  })
}
