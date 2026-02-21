import { hash } from "bcryptjs"
import { NextResponse } from "next/server"
import { Role } from "@prisma/client"
import { z } from "zod"
import { forbidden, requireUser, unauthorized } from "@/lib/api"
import { canManageUsers } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(40),
  password: z.string().min(8),
  role: z.enum(Role),
})

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
  settings: true,
}

export async function GET() {
  const currentUser = await requireUser()
  if (!currentUser) return unauthorized()

  if (canManageUsers(currentUser.role)) {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: userSelect,
    })
    return NextResponse.json({ users })
  }

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true, isActive: true },
    orderBy: { name: "asc" },
  })
  return NextResponse.json({ users })
}

export async function POST(req: Request) {
  const currentUser = await requireUser()
  if (!currentUser) return unauthorized()
  if (!canManageUsers(currentUser.role)) return forbidden("관리자만 팀원을 생성할 수 있습니다.")

  const body = await req.json().catch(() => null)
  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "유효하지 않은 요청입니다.", details: parsed.error.flatten() }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ message: "이미 사용 중인 이메일입니다." }, { status: 409 })
  }

  const passwordHash = await hash(parsed.data.password, 10)

  const created = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      role: parsed.data.role,
      isActive: true,
      passwordHash,
      settings: {
        create: {
          notificationInApp: true,
          defaultStartPage: "/",
          locale: "ko-KR",
          timezone: "Asia/Seoul",
        },
      },
    },
    select: userSelect,
  })

  await prisma.auditLog.create({
    data: {
      actorUserId: currentUser.id,
      action: "USER_CREATE",
      entityType: "USER",
      entityId: created.id,
      afterJson: JSON.stringify({
        email: created.email,
        role: created.role,
        isActive: created.isActive,
      }),
    },
  })

  return NextResponse.json({ user: created }, { status: 201 })
}
