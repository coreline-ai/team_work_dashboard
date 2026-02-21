import { NextResponse } from "next/server"
import { getRecentActivity } from "@/lib/dashboard"

export async function GET() {
  const items = await getRecentActivity()
  return NextResponse.json({ items })
}
