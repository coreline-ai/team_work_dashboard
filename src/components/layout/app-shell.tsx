"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { AdminModeProvider } from "@/components/providers/admin-mode-provider"

const AUTH_ROUTES = ["/login", "/signup"]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  if (isAuthRoute) {
    return <main className="min-h-screen flex items-center justify-center p-6">{children}</main>
  }

  return (
    <AdminModeProvider>
      <Sidebar className="w-64 shrink-0 hidden md:flex" />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </AdminModeProvider>
  )
}
