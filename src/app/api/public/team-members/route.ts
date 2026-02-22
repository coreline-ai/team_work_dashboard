import { NextResponse } from "next/server"
import { TaskStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const members = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      role: true,
      tasksAssigned: {
        where: { deletedAt: null, project: { isArchived: false } },
        orderBy: [{ updatedAt: "desc" }],
        select: {
          id: true,
          title: true,
          phase: true,
          status: true,
          projectId: true,
          project: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const items = members.map((member) => {
    const phaseSet = new Set(member.tasksAssigned.map((task) => task.phase))
    const category = phaseSet.size > 0 ? Array.from(phaseSet).slice(0, 2).join(", ") : "미배정"
    const bucketMap = new Map<
      string,
      {
        projectId: string
        projectName: string
        total: number
        inProgress: number
        completed: number
        delayed: number
        pending: number
      }
    >()

    for (const task of member.tasksAssigned) {
      const key = task.projectId
      const current =
        bucketMap.get(key) ??
        {
          projectId: task.projectId,
          projectName: task.project.name,
          total: 0,
          inProgress: 0,
          completed: 0,
          delayed: 0,
          pending: 0,
        }

      current.total += 1
      if (task.status === TaskStatus.IN_PROGRESS) current.inProgress += 1
      if (task.status === TaskStatus.COMPLETED) current.completed += 1
      if (task.status === TaskStatus.DELAYED) current.delayed += 1
      if (task.status === TaskStatus.PENDING) current.pending += 1
      bucketMap.set(key, current)
    }

    return {
      id: member.id,
      name: member.name,
      role: member.role,
      category,
      taskCount: member.tasksAssigned.length,
      tasks: member.tasksAssigned.map((task) => ({
        id: task.id,
        title: task.title,
        phase: task.phase,
        projectId: task.projectId,
        projectName: task.project.name,
      })),
      projectBuckets: Array.from(bucketMap.values()).sort((a, b) => b.total - a.total),
    }
  })

  return NextResponse.json({ members: items })
}
