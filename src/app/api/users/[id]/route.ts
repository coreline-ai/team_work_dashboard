import { NextResponse } from "next/server"
import { Role } from "@prisma/client"
import { z } from "zod"
import { forbidden, requireUser, unauthorized } from "@/lib/api"
import { canManageUsers } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const updateUserSchema = z.object({
  name: z.string().min(2).max(40).optional(),
  email: z.string().email().optional(),
  role: z.enum(Role).optional(),
  isActive: z.boolean().optional(),
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await requireUser()
  if (!currentUser) return unauthorized()
  if (!canManageUsers(currentUser.role)) return forbidden("관리자만 팀원을 수정할 수 있습니다.")

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "유효하지 않은 요청입니다.", details: parsed.error.flatten() }, { status: 400 })
  }

  const before = await prisma.user.findUnique({ where: { id } })
  if (!before) {
    return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 })
  }

  if (parsed.data.email) {
    const duplicated = await prisma.user.findFirst({
      where: {
        email: parsed.data.email.toLowerCase(),
        id: { not: id },
      },
    })
    if (duplicated) {
      return NextResponse.json({ message: "이미 사용 중인 이메일입니다." }, { status: 409 })
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...parsed.data,
      email: parsed.data.email?.toLowerCase(),
    },
    select: userSelect,
  })

  await prisma.auditLog.create({
    data: {
      actorUserId: currentUser.id,
      action: "USER_UPDATE",
      entityType: "USER",
      entityId: updated.id,
      beforeJson: JSON.stringify({
        name: before.name,
        email: before.email,
        role: before.role,
        isActive: before.isActive,
      }),
      afterJson: JSON.stringify({
        name: updated.name,
        email: updated.email,
        role: updated.role,
        isActive: updated.isActive,
      }),
    },
  })

  return NextResponse.json({ user: updated })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await requireUser()
  if (!currentUser) return unauthorized()
  if (!canManageUsers(currentUser.role)) return forbidden("관리자만 팀원을 비활성화할 수 있습니다.")

  const { id } = await params
  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) {
    return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 })
  }

  if (target.id === currentUser.id) {
    return NextResponse.json({ message: "자기 자신은 비활성화할 수 없습니다." }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: userSelect,
  })

  await prisma.auditLog.create({
    data: {
      actorUserId: currentUser.id,
      action: "USER_DEACTIVATE",
      entityType: "USER",
      entityId: updated.id,
      beforeJson: JSON.stringify({ isActive: target.isActive }),
      afterJson: JSON.stringify({ isActive: false }),
    },
  })

  return NextResponse.json({ user: updated })
}
