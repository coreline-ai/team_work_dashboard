import { NextResponse } from "next/server"
import { getProjectOverview } from "@/lib/projects"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const overview = await getProjectOverview(id)
  if (!overview) {
    return NextResponse.json({ message: "프로젝트를 찾을 수 없습니다." }, { status: 404 })
  }

  return NextResponse.json(overview)
}
