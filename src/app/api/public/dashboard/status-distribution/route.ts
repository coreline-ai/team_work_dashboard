import { NextResponse } from "next/server"
import { getStatusDistribution } from "@/lib/dashboard"

export async function GET() {
  const items = await getStatusDistribution()
  return NextResponse.json({ items })
}
