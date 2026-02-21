import { NextResponse } from "next/server"
import { requireUser, unauthorized } from "@/lib/api"
import { getWeeklyMetrics } from "@/lib/dashboard"

export async function GET() {
  const user = await requireUser()
  if (!user) return unauthorized()

  const weekly = await getWeeklyMetrics(user)
  return NextResponse.json({ items: weekly })
}
