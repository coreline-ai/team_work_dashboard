import { hash } from "bcryptjs"
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(40),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "유효하지 않은 요청입니다.", details: parsed.error.flatten() }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ message: "이미 사용 중인 이메일입니다." }, { status: 409 })
  }

  const userCount = await prisma.user.count()
  const passwordHash = await hash(parsed.data.password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: parsed.data.name,
      role: userCount === 0 ? "ADMIN" : "MEMBER",
      settings: {
        create: {
          notificationInApp: true,
          defaultStartPage: "/",
          locale: "ko-KR",
          timezone: "Asia/Seoul",
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  })

  return NextResponse.json({ message: "회원가입이 완료되었습니다.", user }, { status: 201 })
}
