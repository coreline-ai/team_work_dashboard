import { NextResponse } from "next/server"
import { requireUser, unauthorized } from "@/lib/api"

export async function GET() {
  const user = await requireUser()
  if (!user) return unauthorized()

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl,
      settings: user.settings,
    },
  })
}
