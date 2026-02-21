import { NextResponse } from "next/server"
import { getWeeklyMetrics } from "@/lib/dashboard"

export async function GET() {
  const items = await getWeeklyMetrics()
  return NextResponse.json({ items })
}
