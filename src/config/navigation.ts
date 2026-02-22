import { BarChart3, FolderKanban, LayoutDashboard, ListTodo, Settings, ShieldCheck, Users, type LucideIcon } from "lucide-react"
import type { Role } from "@/types/domain"

export interface NavItem {
    href: "/" | "/dashboard/portfolio" | "/tasks" | "/projects" | "/team-members" | "/settings" | "/completed-projects" | "/activity-log" | "/team-reports"
    label: string
    icon: LucideIcon
    requiresAuth?: boolean
    requiresRole?: Role
}

export const primaryNavigation: NavItem[] = [
    { href: "/dashboard/portfolio", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tasks", label: "Tasks", icon: ListTodo },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/team-members", label: "Team Members", icon: Users },
]

export const secondaryNavigation: NavItem[] = [
    { href: "/settings", label: "Settings", icon: Settings, requiresAuth: true },
    { href: "/team-reports", label: "Team Reports", icon: BarChart3, requiresAuth: true },
    { href: "/completed-projects", label: "Completed Projects", icon: FolderKanban, requiresAuth: true },
    { href: "/activity-log", label: "Activity Log", icon: ShieldCheck, requiresAuth: true },
]

export const adminNavigation: NavItem[] = [
    { href: "/team-members", label: "Team Admin", icon: ShieldCheck, requiresAuth: true, requiresRole: "ADMIN" },
]
