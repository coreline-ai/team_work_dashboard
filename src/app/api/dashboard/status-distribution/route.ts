import { NextResponse } from "next/server"
import { requireUser, unauthorized } from "@/lib/api"
import { getStatusDistribution } from "@/lib/dashboard"

export async function GET() {
  const user = await requireUser()
  if (!user) return unauthorized()

  const items = await getStatusDistribution(user)
  return NextResponse.json({ items })
}
