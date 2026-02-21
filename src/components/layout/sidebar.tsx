import * as React from "react"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ListTodo, Settings, Users, FolderKanban } from "lucide-react"
import Link from "next/link"

export function Sidebar({ className }: { className?: string }) {
    return (
        <aside className={cn("flex flex-col bg-slate-50 border-r border-slate-200 h-full", className)}>
            <div className="flex h-16 items-center px-6 border-b border-slate-200">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-800">
                    <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs">R</div>
                    RichProp
                </Link>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                <Link href="/" className="flex items-center gap-3 rounded-md bg-white border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 shadow-sm">
                    <LayoutDashboard className="h-4 w-4 text-blue-600" />
                    Dashboard
                </Link>
                <Link href="/tasks" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 transition-colors">
                    <ListTodo className="h-4 w-4" />
                    Tasks
                </Link>
                <Link href="#" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 transition-colors">
                    <FolderKanban className="h-4 w-4" />
                    Projects
                </Link>
                <Link href="#" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 transition-colors">
                    <Users className="h-4 w-4" />
                    Team Members
                </Link>
            </nav>
            <div className="p-4 border-t border-slate-200">
                <Link href="#" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 transition-colors">
                    <Settings className="h-4 w-4" />
                    Settings
                </Link>
            </div>
        </aside>
    )
}
