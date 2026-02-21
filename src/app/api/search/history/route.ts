import { NextResponse } from "next/server"
import { SearchScope } from "@prisma/client"
import { z } from "zod"
import { requireUser, unauthorized } from "@/lib/api"
import { prisma } from "@/lib/prisma"

const createSchema = z.object({
  query: z.string().min(1).max(120),
  scope: z.enum(SearchScope),
})

export async function GET() {
  const user = await requireUser()
  if (!user) return unauthorized()

  const items = await prisma.searchHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "유효하지 않은 요청입니다.", details: parsed.error.flatten() }, { status: 400 })
  }

  await prisma.searchHistory.create({
    data: {
      userId: user.id,
      query: parsed.data.query,
      scope: parsed.data.scope,
    },
  })

  const all = await prisma.searchHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })

  if (all.length > 20) {
    const overflow = all.slice(20)
    await prisma.searchHistory.deleteMany({
      where: { id: { in: overflow.map((item) => item.id) } },
    })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
