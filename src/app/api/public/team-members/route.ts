import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const members = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      role: true,
      tasksAssigned: {
        where: { deletedAt: null },
        orderBy: [{ updatedAt: "desc" }],
        select: {
          id: true,
          title: true,
          phase: true,
        },
        take: 12,
      },
    },
    orderBy: { name: "asc" },
  })

  const items = members.map((member) => {
    const phaseSet = new Set(member.tasksAssigned.map((task) => task.phase))
    const category = phaseSet.size > 0 ? Array.from(phaseSet).slice(0, 2).join(", ") : "미배정"

    return {
      id: member.id,
      name: member.name,
      role: member.role,
      category,
      taskCount: member.tasksAssigned.length,
      tasks: member.tasksAssigned,
    }
  })

  return NextResponse.json({ members: items })
}
