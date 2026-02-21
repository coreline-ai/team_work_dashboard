import { NextResponse } from "next/server"
import { requireUser, unauthorized } from "@/lib/api"
import { getKpi } from "@/lib/dashboard"

export async function GET() {
  const user = await requireUser()
  if (!user) return unauthorized()

  const kpi = await getKpi(user)
  return NextResponse.json(kpi)
}
