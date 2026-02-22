import { NextResponse } from "next/server"
import { getPortfolioOverview } from "@/lib/projects"

export async function GET() {
  const overview = await getPortfolioOverview()
  return NextResponse.json(overview)
}
