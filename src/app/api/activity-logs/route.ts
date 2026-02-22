import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, unauthorized } from "@/lib/api"
import { isAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const querySchema = z.object({
  actorUserId: z.string().optional(),
  entityType: z.string().trim().optional(),
  action: z.string().trim().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
})

function safeJsonParse(value?: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    actorUserId: searchParams.get("actorUserId") ?? undefined,
    entityType: searchParams.get("entityType") ?? undefined,
    action: searchParams.get("action") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid query parameters", details: parsed.error.flatten() }, { status: 400 })
  }

  const { page, pageSize } = parsed.data
  const skip = (page - 1) * pageSize

  const where: Prisma.AuditLogWhereInput = {}

  if (parsed.data.entityType) where.entityType = parsed.data.entityType
  if (parsed.data.action) where.action = parsed.data.action
  if (parsed.data.from || parsed.data.to) {
    where.createdAt = {
      ...(parsed.data.from ? { gte: new Date(parsed.data.from) } : {}),
      ...(parsed.data.to ? { lte: new Date(parsed.data.to) } : {}),
    }
  }

  if (isAdmin(user.role)) {
    if (parsed.data.actorUserId) where.actorUserId = parsed.data.actorUserId
  } else {
    where.actorUserId = user.id
  }

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    }),
  ])

  const byAction = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.action] = (acc[item.action] ?? 0) + 1
    return acc
  }, {})

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId,
      actor: item.actor
        ? {
            id: item.actor.id,
            name: item.actor.name,
            role: item.actor.role,
          }
        : null,
      before: safeJsonParse(item.beforeJson),
      after: safeJsonParse(item.afterJson),
      createdAt: item.createdAt.toISOString(),
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    summary: {
      byAction,
    },
  })
}
