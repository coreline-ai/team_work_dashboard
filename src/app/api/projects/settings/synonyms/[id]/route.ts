import { NextResponse } from "next/server"
import { z } from "zod"
import { badRequest, forbidden, requireUser, unauthorized } from "@/lib/api"
import { canManageProjects } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { normalizeSearchQuery } from "@/lib/search"

const updateSchema = z.object({
  projectId: z.string().trim().min(1).nullable().optional(),
  keyword: z.string().trim().min(1).max(80).optional(),
  synonyms: z.array(z.string().trim().min(1).max(80)).min(1).max(20).optional(),
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return unauthorized()
  if (!canManageProjects(user.role)) return forbidden()

  const { id } = await params
  const existing = await prisma.searchSynonym.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ message: "Synonym not found" }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest("Invalid request payload", parsed.error.flatten())
  }

  const projectId = parsed.data.projectId !== undefined ? toProjectId(parsed.data.projectId) : existing.projectId
  const keyword = parsed.data.keyword !== undefined ? normalizeSearchQuery(parsed.data.keyword) : existing.keyword
  const synonyms = parsed.data.synonyms !== undefined ? normalizeList(parsed.data.synonyms) : existing.synonyms
  const isActive = parsed.data.isActive ?? existing.isActive

  if (!keyword) return badRequest("keyword is required")
  if (synonyms.length === 0) return badRequest("synonyms must have at least one value")
  if (synonyms.includes(keyword)) return badRequest("keyword cannot be included in synonyms")

  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
    if (!project) return badRequest("projectId is invalid")
  }

  const duplicate = await prisma.searchSynonym.findFirst({
    where: {
      id: { not: id },
      projectId,
      keyword,
    },
    select: { id: true },
  })
  if (duplicate) {
    return NextResponse.json({ message: "Duplicate keyword in same scope" }, { status: 409 })
  }

  const updated = await prisma.searchSynonym.update({
    where: { id },
    data: {
      projectId,
      keyword,
      synonyms,
      isActive,
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
      id: updated.id,
      projectId: updated.projectId,
      projectName: updated.project?.name ?? null,
      keyword: updated.keyword,
      synonyms: updated.synonyms,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt.toISOString(),
    },
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return unauthorized()
  if (!canManageProjects(user.role)) return forbidden()

  const { id } = await params
  const existing = await prisma.searchSynonym.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json({ message: "Synonym not found" }, { status: 404 })
  }

  await prisma.searchSynonym.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
