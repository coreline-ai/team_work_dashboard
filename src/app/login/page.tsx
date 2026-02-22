"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [callbackUrl, setCallbackUrl] = React.useState("/")

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    setCallbackUrl(query.get("callbackUrl") ?? "/")
  }, [])

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    })

    setLoading(false)

    if (!result || result.error) {
      setError("로그인에 실패했습니다. 이메일/비밀번호를 확인하세요.")
      return
    }

    router.push(result.url ?? callbackUrl)
    router.refresh()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>로그인</CardTitle>
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="login-home-button">홈으로</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-slate-700">이메일</span>
            <input
              data-testid="login-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-slate-700">비밀번호</span>
            <input
              data-testid="login-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit">
            {loading ? "로그인 중..." : "로그인"}
          </Button>
          <p className="text-sm text-slate-500 text-center">
            계정이 없나요? <Link href="/signup" className="text-blue-600 hover:underline">회원가입</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
