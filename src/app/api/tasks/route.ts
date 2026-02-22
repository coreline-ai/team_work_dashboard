import { NextResponse } from "next/server"
import { TaskPriority, TaskStatus } from "@prisma/client"
import { z } from "zod"
import { requireUser, unauthorized } from "@/lib/api"
import { createNotification } from "@/lib/notifications"
import { isAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const createTaskSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).optional().nullable(),
  phase: z.string().min(1).max(40),
  status: z.enum(TaskStatus).default(TaskStatus.PENDING),
  priority: z.enum(TaskPriority).default(TaskPriority.MEDIUM),
  startDate: z.string(),
  endDate: z.string(),
  progress: z.number().int().min(0).max(100).default(0),
  parentId: z.string().optional().nullable(),
  assigneeId: z.string(),
  projectId: z.string().optional(),
})

function computeDepthById(
  id: string,
  parentMap: Map<string, string | null>,
  depthMap: Map<string, number>,
): number {
  if (depthMap.has(id)) return depthMap.get(id) ?? 0
  const parentId = parentMap.get(id)
  if (!parentId) {
    depthMap.set(id, 0)
    return 0
  }
  const depth = computeDepthById(parentId, parentMap, depthMap) + 1
  depthMap.set(id, depth)
  return depth
}

export async function GET(req: Request) {
  const currentUser = await requireUser()
  if (!currentUser) return unauthorized()

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const assigneeFilter = searchParams.get("assignee")
  const status = searchParams.get("status")
  const phase = searchParams.get("phase")
  const q = searchParams.get("q")

  const where: {
    deletedAt: null
    project?: { isArchived: boolean }
    projectId?: string
    status?: TaskStatus
    phase?: { contains: string; mode: "insensitive" }
    OR?: Array<{ title: { contains: string; mode: "insensitive" } } | { phase: { contains: string; mode: "insensitive" } } | { assignee: { name: { contains: string; mode: "insensitive" } } }>
    AND?: Array<{ OR: Array<{ assigneeId: string } | { createdById: string }> }>
    assigneeId?: string
  } = {
    deletedAt: null,
    project: { isArchived: false },
  }

  if (projectId) {
    where.projectId = projectId
  }
  if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
    where.status = status as TaskStatus
  }
  if (phase) {
    where.phase = { contains: phase, mode: "insensitive" }
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { phase: { contains: q, mode: "insensitive" } },
      { assignee: { name: { contains: q, mode: "insensitive" } } },
    ]
  }

  if (!isAdmin(currentUser.role)) {
    where.AND = [{ OR: [{ assigneeId: currentUser.id }, { createdById: currentUser.id }] }]
    if (assigneeFilter === "me" || !assigneeFilter) {
      where.assigneeId = currentUser.id
    }
  } else if (assigneeFilter === "me") {
    where.assigneeId = currentUser.id
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ phase: "asc" }, { createdAt: "asc" }],
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      project: { select: { id: true, name: true } },
    },
  })

  const parentMap = new Map(tasks.map((task) => [task.id, task.parentId]))
  const depthMap = new Map<string, number>()

  const items = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    phase: task.phase,
    status: task.status,
    priority: task.priority,
    startDate: task.startDate.toISOString(),
    endDate: task.endDate.toISOString(),
    progress: task.progress,
    parentId: task.parentId,
    depth: computeDepthById(task.id, parentMap, depthMap),
    projectId: task.projectId,
    project: task.project,
    createdById: task.createdById,
    assigneeId: task.assigneeId,
    assignee: task.assignee,
  }))

  return NextResponse.json({ tasks: items })
}

export async function POST(req: Request) {
  const currentUser = await requireUser()
  if (!currentUser) return unauthorized()

  const body = await req.json().catch(() => null)
  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "유효하지 않은 요청입니다.", details: parsed.error.flatten() }, { status: 400 })
  }

  const projectId = parsed.data.projectId
    ? (
        await prisma.project.findFirst({
          where: { id: parsed.data.projectId, isArchived: false },
          select: { id: true },
        })
      )?.id
    : (
        await prisma.project.findFirst({
          where: { isArchived: false },
          select: { id: true },
          orderBy: { createdAt: "asc" },
        })
      )?.id

  if (!projectId) {
    return NextResponse.json({ message: "연결 가능한 프로젝트가 없습니다." }, { status: 400 })
  }

  if (parsed.data.parentId) {
    const parent = await prisma.task.findUnique({
      where: { id: parsed.data.parentId },
      select: { id: true, projectId: true, deletedAt: true },
    })
    if (!parent || parent.deletedAt) {
      return NextResponse.json({ message: "부모 업무를 찾을 수 없습니다." }, { status: 400 })
    }
    if (parent.projectId !== projectId) {
      return NextResponse.json({ message: "부모 업무와 동일 프로젝트에 생성해야 합니다." }, { status: 400 })
    }
  }

  const created = await prisma.task.create({
    data: {
      projectId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      phase: parsed.data.phase,
      status: parsed.data.status,
      priority: parsed.data.priority,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      progress: parsed.data.progress,
      parentId: parsed.data.parentId ?? null,
      assigneeId: parsed.data.assigneeId,
      createdById: currentUser.id,
      updatedById: currentUser.id,
    },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
    },
  })

  if (created.assigneeId !== currentUser.id) {
    await createNotification({
      userId: created.assigneeId,
      type: "ASSIGNED",
      title: "새 업무가 배정되었습니다.",
      body: `${created.title} 업무가 배정되었습니다.`,
      relatedTaskId: created.id,
    })
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: currentUser.id,
      action: "TASK_CREATE",
      entityType: "TASK",
      entityId: created.id,
      afterJson: JSON.stringify({
        title: created.title,
        assigneeId: created.assigneeId,
        status: created.status,
      }),
    },
  })

  return NextResponse.json({ task: created }, { status: 201 })
}
