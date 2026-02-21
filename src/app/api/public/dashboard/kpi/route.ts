import { NextResponse } from "next/server"
import { getKpi } from "@/lib/dashboard"

export async function GET() {
  const kpi = await getKpi()
  return NextResponse.json(kpi)
}
