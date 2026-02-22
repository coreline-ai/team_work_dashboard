"use client"

import * as React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAdminMode } from "@/components/providers/admin-mode-provider"
import { adminNavigation, primaryNavigation, secondaryNavigation, type NavItem } from "@/config/navigation"

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname()
    const { data: session } = useSession()
    const { enabled: adminModeEnabled } = useAdminMode()

    const isAuthenticated = Boolean(session?.user)
    const userRole = session?.user?.role

    const isActive = (item: NavItem) => {
        if (item.href === "/dashboard/portfolio") {
            return pathname === "/" || pathname === "/dashboard/portfolio" || pathname.startsWith("/dashboard/projects/")
        }
        if (item.href === "/") return pathname === "/"
        return pathname === item.href || pathname.startsWith(`${item.href}/`)
    }

    const linkClassName = (item: NavItem) => cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive(item)
            ? "bg-white border border-slate-200 text-slate-900 shadow-sm"
            : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
    )

    const hasAccess = (item: NavItem) => {
        if (item.requiresAuth && !isAuthenticated) return false
        if (item.requiresRole && item.requiresRole !== userRole) return false
        return true
    }

    const visiblePrimary = primaryNavigation.filter(hasAccess)
    const visibleSecondary = secondaryNavigation.filter(hasAccess)
    const visibleAdmin = adminModeEnabled ? adminNavigation.filter(hasAccess) : []

    return (
        <aside className={cn("flex flex-col bg-slate-50 border-r border-slate-200 h-full", className)}>
            <div className="flex h-16 items-center px-6 border-b border-slate-200">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-800">
                    <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs">R</div>
                    RichProp
                </Link>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {visiblePrimary.map((item) => {
                    const Icon = item.icon
                    return (
                        <Link key={item.href} href={item.href} className={linkClassName(item)}>
                            <Icon className={cn("h-4 w-4", isActive(item) ? "text-blue-600" : "text-slate-500")} />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>
            <div className="p-4 border-t border-slate-200">
                {visibleSecondary.map((item) => {
                    const Icon = item.icon
                    return (
                        <Link key={item.href} href={item.href} className={linkClassName(item)}>
                            <Icon className={cn("h-4 w-4", isActive(item) ? "text-blue-600" : "text-slate-500")} />
                            {item.label}
                        </Link>
                    )
                })}
                {visibleAdmin.length > 0 ? (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-1">
                        <p className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Admin</p>
                        {visibleAdmin.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link key={`admin-${item.label}`} href={item.href} className={linkClassName(item)}>
                                    <Icon className={cn("h-4 w-4", isActive(item) ? "text-blue-600" : "text-slate-500")} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>
                ) : null}
            </div>
        </aside>
    )
}
