"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format, parseISO } from "date-fns"

type TaskStatus = "COMPLETED" | "IN_PROGRESS" | "PENDING" | "DELAYED"

const statusMap: Record<TaskStatus, { label: string; variant: "completed" | "progress" | "pending" | "delayed" }> = {
    COMPLETED: { label: "완료", variant: "completed" },
    IN_PROGRESS: { label: "진행중", variant: "progress" },
    PENDING: { label: "대기", variant: "pending" },
    DELAYED: { label: "지연", variant: "delayed" },
}

export function RecentActivityTable() {
    const [recentTasks, setRecentTasks] = React.useState<Array<{
        id: string
        title: string
        phase: string
        status: TaskStatus
        progress: number
        startDate: string
        endDate: string
        assignee: { id: string; name: string; avatarUrl?: string | null }
    }>>([])

    React.useEffect(() => {
        const run = async () => {
            const res = await fetch("/api/public/dashboard/recent-activity")
            if (!res.ok) return
            const payload = await res.json()
            setRecentTasks(payload.items ?? [])
        }
        run()
    }, [])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">최근 업데이트 업무</CardTitle>
                <CardDescription>최근 변경된 주요 업무 현황</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">업무명</th>
                                <th className="py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">구분</th>
                                <th className="py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">담당자</th>
                                <th className="py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">상태</th>
                                <th className="py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">일정</th>
                                <th className="py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">진행률</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTasks.map((task) => {
                                const status = statusMap[task.status]
                                return (
                                    <tr key={task.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3 px-4 font-medium text-slate-800">{task.title}</td>
                                        <td className="py-3 px-4">
                                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{task.phase}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6 text-[10px]">
                                                    <AvatarFallback>{task.assignee.name.slice(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-slate-700">{task.assignee.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant={status.variant}>{status.label}</Badge>
                                        </td>
                                        <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                                            {format(parseISO(task.startDate), "MM/dd")} ~ {format(parseISO(task.endDate), "MM/dd")}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${task.progress}%`,
                                                            backgroundColor: task.progress === 100 ? "#10b981" : task.progress > 50 ? "#3b82f6" : "#f59e0b",
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-slate-600">{task.progress}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
