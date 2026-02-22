import { NextResponse } from "next/server"
import { z } from "zod"
import { forbidden, requireUser, unauthorized } from "@/lib/api"
import { canManageProjects } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { getWeeklySnapshots, upsertWeeklySnapshot } from "@/lib/team-reports"

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(52).default(12),
})

const bodySchema = z.object({
  weekStart: z.string().optional(),
})

export async function GET(req: Request) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid query parameters", details: parsed.error.flatten() }, { status: 400 })
  }

  const snapshots = await getWeeklySnapshots(parsed.data.limit)
  return NextResponse.json({ items: snapshots })
}

export async function POST(req: Request) {
  const user = await requireUser()
  if (!user) return unauthorized()
  if (!canManageProjects(user.role)) return forbidden("관리자만 스냅샷을 생성할 수 있습니다.")

  const body = await req.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request body", details: parsed.error.flatten() }, { status: 400 })
  }

  const snapshot = await upsertWeeklySnapshot({
    weekStart: parsed.data.weekStart,
    generatedById: user.id,
  })

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "WEEKLY_SNAPSHOT_GENERATE",
      entityType: "TEAM_WEEKLY_SNAPSHOT",
      entityId: snapshot.id,
      afterJson: JSON.stringify({
        weekStart: snapshot.weekStart,
        createdAt: snapshot.createdAt,
      }),
    },
  })

  return NextResponse.json({ item: snapshot }, { status: 201 })
}
