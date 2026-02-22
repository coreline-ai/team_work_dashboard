import { NextResponse } from "next/server"
import { z } from "zod"
import { badRequest, forbidden, requireUser, unauthorized } from "@/lib/api"
import { canManageProjects } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { normalizeSearchQuery } from "@/lib/search"

const upsertSchema = z.object({
  projectId: z.string().trim().min(1).nullable().optional(),
  keyword: z.string().trim().min(1).max(80),
  synonyms: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
  isActive: z.boolean().optional(),
})

function normalizeList(values: string[]) {
  return Array.from(new Set(values.map((value) => normalizeSearchQuery(value)).filter(Boolean)))
}

function toProjectId(value?: string | null) {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function GET(req: Request) {
  const user = await requireUser()
  if (!user) return unauthorized()
  if (!canManageProjects(user.role)) return forbidden()

  const { searchParams } = new URL(req.url)
  const projectIdParam = searchParams.get("projectId")
  const includeGlobal = searchParams.get("includeGlobal") !== "false"

  const normalizedProjectId = toProjectId(projectIdParam)

  const where =
    normalizedProjectId
      ? {
          OR: includeGlobal
            ? [{ projectId: normalizedProjectId }, { projectId: null }]
            : [{ projectId: normalizedProjectId }],
        }
      : undefined

  const items = await prisma.searchSynonym.findMany({
    where,
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { keyword: "asc" }],
  })

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      projectId: item.projectId,
      projectName: item.project?.name ?? null,
      keyword: item.keyword,
      synonyms: item.synonyms,
      isActive: item.isActive,
      updatedAt: item.updatedAt.toISOString(),
    })),
  })
}

export async function POST(req: Request) {
  const user = await requireUser()
  if (!user) return unauthorized()
  if (!canManageProjects(user.role)) return forbidden()

  const body = await req.json().catch(() => null)
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest("Invalid request payload", parsed.error.flatten())
  }

  const projectId = toProjectId(parsed.data.projectId)
  const keyword = normalizeSearchQuery(parsed.data.keyword)
  const synonyms = normalizeList(parsed.data.synonyms)

  if (!keyword) return badRequest("keyword is required")
  if (synonyms.length === 0) return badRequest("synonyms must have at least one value")
  if (synonyms.includes(keyword)) return badRequest("keyword cannot be included in synonyms")

  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
    if (!project) return badRequest("projectId is invalid")
  }

  const existing = await prisma.searchSynonym.findFirst({
    where: { projectId, keyword },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json({ message: "Duplicate keyword in same scope" }, { status: 409 })
  }

  const created = await prisma.searchSynonym.create({
    data: {
      projectId,
      keyword,
      synonyms,
      isActive: parsed.data.isActive ?? true,
      createdById: user.id,
      updatedById: user.id,
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  })

  return NextResponse.json({
    item: {
      id: created.id,
      projectId: created.projectId,
      projectName: created.project?.name ?? null,
      keyword: created.keyword,
      synonyms: created.synonyms,
      isActive: created.isActive,
      updatedAt: created.updatedAt.toISOString(),
    },
  }, { status: 201 })
}
