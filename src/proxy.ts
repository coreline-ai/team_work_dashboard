import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AUTH_ROUTES = ["/login", "/signup"]
const PUBLIC_PAGE_ROUTES = ["/", "/dashboard", "/tasks", "/projects", "/team-members", "/search", ...AUTH_ROUTES]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  const isPublicApi = pathname.startsWith("/api/public/")
  if (isPublicApi) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuthRoute = AUTH_ROUTES.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  const isPublicPage = PUBLIC_PAGE_ROUTES.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  if (isPublicPage) {
    return NextResponse.next()
  }

  if (!token && pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!token) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|robots.txt|sitemap.xml).*)"],
}
