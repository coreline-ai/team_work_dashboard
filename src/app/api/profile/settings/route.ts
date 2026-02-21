import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, unauthorized } from "@/lib/api"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
  notificationInApp: z.boolean().optional(),
  defaultStartPage: z.enum(["/", "/tasks", "/projects", "/team-members", "/settings"]).optional(),
  locale: z.string().min(2).max(20).optional(),
  timezone: z.string().min(2).max(50).optional(),
})

export async function GET() {
  const user = await requireUser()
  if (!user) return unauthorized()

  const settings = await prisma.profileSettings.findUnique({
    where: { userId: user.id },
  })

  return NextResponse.json({
    settings: settings ?? {
      notificationInApp: true,
      defaultStartPage: "/",
      locale: "ko-KR",
      timezone: "Asia/Seoul",
    },
  })
}

export async function PATCH(req: Request) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "유효하지 않은 요청입니다.", details: parsed.error.flatten() }, { status: 400 })
  }

  const settings = await prisma.profileSettings.upsert({
    where: { userId: user.id },
    update: parsed.data,
    create: {
      userId: user.id,
      notificationInApp: parsed.data.notificationInApp ?? true,
      defaultStartPage: parsed.data.defaultStartPage ?? "/",
      locale: parsed.data.locale ?? "ko-KR",
      timezone: parsed.data.timezone ?? "Asia/Seoul",
    },
  })

  return NextResponse.json({ settings })
}
