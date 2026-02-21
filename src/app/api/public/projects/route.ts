import { NextResponse } from "next/server"
import { getProjectSummaries } from "@/lib/projects"

export async function GET() {
  const projects = await getProjectSummaries()
  return NextResponse.json({ projects })
}
