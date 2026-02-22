import { NextResponse } from "next/server"
import { TaskStatus } from "@prisma/client"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

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
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const status = searchParams.get("status")
  const phase = searchParams.get("phase")
  const q = searchParams.get("q")

  const where: Prisma.TaskWhereInput = {
    deletedAt: null,
    project: { isArchived: false, completedAt: null },
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
    assignee: {
      id: task.assignee.id,
      name: task.assignee.name,
      avatarUrl: task.assignee.avatarUrl,
    },
  }))

  return NextResponse.json({ tasks: items })
}
