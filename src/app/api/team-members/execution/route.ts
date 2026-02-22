import { TaskStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, unauthorized } from "@/lib/api"
import { prisma } from "@/lib/prisma"
import type { TeamMembersExecutionResponse } from "@/types/domain"

const querySchema = z.object({
  memberId: z.string().optional(),
  projectId: z.string().optional(),
  q: z.string().trim().optional(),
  limitPerProject: z.coerce.number().int().min(1).max(100).default(20),
})

type Bucket = {
  projectId: string
  projectName: string
  inProgressCount: number
  delayedCount: number
  pendingCount: number
  completedCount: number
  tasks: Array<{
    id: string
    title: string
    phase: string
    projectId: string
    projectName: string
    status: TaskStatus
    priority: "HIGH" | "MEDIUM" | "LOW"
    startDate: string
    endDate: string
    progress: number
    updatedAt: number
  }>
}

export async function GET(req: Request) {
  const currentUser = await requireUser()
  if (!currentUser) return unauthorized()

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    memberId: searchParams.get("memberId") ?? undefined,
    projectId: searchParams.get("projectId") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    limitPerProject: searchParams.get("limitPerProject") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { memberId, projectId, q, limitPerProject } = parsed.data
  const qLower = q?.toLowerCase() ?? ""

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(memberId ? { id: memberId } : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      role: true,
      tasksAssigned: {
        where: {
          deletedAt: null,
          project: {
            isArchived: false,
            completedAt: null,
          },
          ...(projectId ? { projectId } : {}),
        },
        select: {
          id: true,
          title: true,
          phase: true,
          status: true,
          priority: true,
          startDate: true,
          endDate: true,
          progress: true,
          updatedAt: true,
          projectId: true,
          project: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  const members = users
    .map((user) => {
      const memberNameMatches = qLower.length > 0 && user.name.toLowerCase().includes(qLower)
      const filteredTasks = user.tasksAssigned.filter((task) => {
        if (qLower.length === 0 || memberNameMatches) return true
        return task.title.toLowerCase().includes(qLower) || task.phase.toLowerCase().includes(qLower)
      })

      const bucketMap = new Map<string, Bucket>()
      for (const task of filteredTasks) {
        const key = task.projectId
        const current = bucketMap.get(key) ?? {
          projectId: task.projectId,
          projectName: task.project.name,
          inProgressCount: 0,
          delayedCount: 0,
          pendingCount: 0,
          completedCount: 0,
          tasks: [],
        }

        if (task.status === TaskStatus.IN_PROGRESS) current.inProgressCount += 1
        if (task.status === TaskStatus.DELAYED) current.delayedCount += 1
        if (task.status === TaskStatus.PENDING) current.pendingCount += 1
        if (task.status === TaskStatus.COMPLETED) current.completedCount += 1

        if (task.status === TaskStatus.IN_PROGRESS) {
          current.tasks.push({
            id: task.id,
            title: task.title,
            phase: task.phase,
            projectId: task.projectId,
            projectName: task.project.name,
            status: task.status,
            priority: task.priority,
            startDate: task.startDate.toISOString(),
            endDate: task.endDate.toISOString(),
            progress: task.progress,
            updatedAt: task.updatedAt.getTime(),
          })
        }

        bucketMap.set(key, current)
      }

      const projects = Array.from(bucketMap.values())
        .map((bucket) => ({
          projectId: bucket.projectId,
          projectName: bucket.projectName,
          inProgressCount: bucket.inProgressCount,
          delayedCount: bucket.delayedCount,
          pendingCount: bucket.pendingCount,
          completedCount: bucket.completedCount,
          tasks: bucket.tasks
            .sort((a, b) => {
              const endDiff = new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
              if (endDiff !== 0) return endDiff
              return b.updatedAt - a.updatedAt
            })
            .slice(0, limitPerProject)
            .map((task) => ({
              id: task.id,
              title: task.title,
              phase: task.phase,
              projectId: task.projectId,
              projectName: task.projectName,
              status: task.status,
              priority: task.priority,
              startDate: task.startDate,
              endDate: task.endDate,
              progress: task.progress,
            })),
        }))
        .sort((a, b) => b.inProgressCount - a.inProgressCount || a.projectName.localeCompare(b.projectName))

      const totalInProgress = projects.reduce((sum, project) => sum + project.inProgressCount, 0)
      return {
        memberId: user.id,
        memberName: user.name,
        role: user.role,
        totalInProgress,
        projects,
      }
    })
    .filter((member) => {
      if (memberId && member.memberId === memberId) return true
      return member.totalInProgress > 0
    })
    .sort((a, b) => b.totalInProgress - a.totalInProgress || a.memberName.localeCompare(b.memberName))

  const uniqueProjects = new Set<string>()
  let totalInProgress = 0
  for (const member of members) {
    totalInProgress += member.totalInProgress
    for (const project of member.projects) {
      uniqueProjects.add(project.projectId)
    }
  }

  const response: TeamMembersExecutionResponse = {
    members,
    summary: {
      members: members.length,
      projects: uniqueProjects.size,
      inProgressTasks: totalInProgress,
    },
  }

  return NextResponse.json(response)
}
