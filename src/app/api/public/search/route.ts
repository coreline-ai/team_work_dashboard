import { NextResponse } from "next/server"
import { Prisma, SearchScope, TaskStatus } from "@prisma/client"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const querySchema = z.object({
  q: z.string().optional().default(""),
  scope: z.enum(SearchScope).optional(),
  status: z.enum(TaskStatus).optional(),
  phase: z.string().optional(),
  projectId: z.string().optional(),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    q: searchParams.get("q") ?? "",
    scope: searchParams.get("scope") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    phase: searchParams.get("phase") ?? undefined,
    projectId: searchParams.get("projectId") ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ tasks: [], projects: [], members: [] })
  }

  const q = parsed.data.q.trim()
  const scope = parsed.data.scope
  const canApplyTaskFilter = !scope || scope === SearchScope.TASK

  if (!q) {
    return NextResponse.json({ tasks: [], projects: [], members: [] })
  }

  const taskAnd: Prisma.TaskWhereInput[] = [
    {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { phase: { contains: q, mode: "insensitive" } },
        { assignee: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
  ]

  if (canApplyTaskFilter && parsed.data.status) {
    taskAnd.push({ status: parsed.data.status })
  }
  if (canApplyTaskFilter && parsed.data.phase) {
    taskAnd.push({ phase: { contains: parsed.data.phase, mode: "insensitive" } })
  }
  if (canApplyTaskFilter && parsed.data.projectId) {
    taskAnd.push({ projectId: parsed.data.projectId })
  }

  const [tasks, projects, members] = await Promise.all([
    !scope || scope === SearchScope.TASK
      ? prisma.task.findMany({
          where: {
            deletedAt: null,
            AND: taskAnd,
          },
          select: { id: true, title: true, phase: true, status: true, projectId: true },
          take: 10,
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
    !scope || scope === SearchScope.PROJECT
      ? prisma.project.findMany({
          where: {
            isArchived: false,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, description: true },
          take: 10,
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
    !scope || scope === SearchScope.MEMBER
      ? prisma.user.findMany({
          where: {
            isActive: true,
            name: { contains: q, mode: "insensitive" },
          },
          select: { id: true, name: true, role: true },
          take: 10,
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ])

  return NextResponse.json({ tasks, projects, members })
}
