import * as React from "react"
import { cn } from "@/lib/utils"
import { Bell, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header({ className }: { className?: string }) {
    return (
        <header className={cn("flex items-center justify-between px-6 bg-white border-b border-slate-200 h-16 shrink-0 z-10", className)}>
            <div className="flex items-center flex-1">
                <div className="relative w-full max-w-md hidden md:flex items-center">
                    <Search className="absolute left-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tasks, projects..."
                        className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium placeholder:font-normal"
                    />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button className="relative text-slate-500 hover:text-slate-800 transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                </button>
                <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-sm font-semibold text-slate-800">John Doe</span>
                        <span className="text-xs font-medium text-slate-500">Project Manager</span>
                    </div>
                    <Avatar className="h-9 w-9 border border-slate-200 shadow-sm cursor-pointer">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    )
}
