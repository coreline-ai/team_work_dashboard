import { NextResponse } from "next/server"
import { getProjectSummaries } from "@/lib/projects"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const includeCompleted = searchParams.get("includeCompleted") === "true"
  const projects = await getProjectSummaries({ includeCompleted })
  return NextResponse.json({ projects })
}
