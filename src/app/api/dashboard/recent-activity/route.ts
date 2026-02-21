import { NextResponse } from "next/server"
import { requireUser, unauthorized } from "@/lib/api"
import { getRecentActivity } from "@/lib/dashboard"

export async function GET() {
  const user = await requireUser()
  if (!user) return unauthorized()

  const items = await getRecentActivity(user)
  return NextResponse.json({ items })
}
