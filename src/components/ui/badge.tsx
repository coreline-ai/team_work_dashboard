import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "completed" | "delayed" | "progress" | "pending"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                {
                    "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80": variant === "default",
                    "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80": variant === "secondary",
                    "border-transparent bg-red-100 text-red-600 hover:bg-red-100/80": variant === "destructive",
                    "border-transparent bg-blue-100 text-blue-700": variant === "progress",
                    "border-transparent bg-emerald-100 text-emerald-700": variant === "completed",
                    "border-transparent bg-rose-100 text-rose-700": variant === "delayed",
                    "border-transparent bg-amber-100 text-amber-700": variant === "pending",
                    "text-slate-950": variant === "outline",
                },
                className
            )}
            {...props}
        />
    )
}

export { Badge }
