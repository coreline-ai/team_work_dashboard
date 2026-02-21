import { NextResponse } from "next/server"
import { forbidden, requireUser, unauthorized } from "@/lib/api"
import { prisma } from "@/lib/prisma"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const { id } = await params
  const item = await prisma.searchHistory.findUnique({ where: { id } })
  if (!item) {
    return NextResponse.json({ message: "검색 기록을 찾을 수 없습니다." }, { status: 404 })
  }
  if (item.userId !== user.id) {
    return forbidden("해당 검색 기록에 접근할 수 없습니다.")
  }

  await prisma.searchHistory.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
