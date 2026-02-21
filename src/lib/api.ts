import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ message, details }, { status: 400 })
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ message }, { status: 401 })
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ message }, { status: 403 })
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user || !user.isActive) return null
  return user
}
