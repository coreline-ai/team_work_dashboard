"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { tasks } from "@/data/mock-data"
import { TaskStatus, TaskPriority, type Task } from "@/data/types"
import { ChevronRight, ChevronDown, Calendar, MoreHorizontal, Plus, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"

const statusMap: Record<TaskStatus, { label: string; variant: "completed" | "progress" | "pending" | "delayed" }> = {
    [TaskStatus.COMPLETED]: { label: "완료", variant: "completed" },
    [TaskStatus.IN_PROGRESS]: { label: "진행중", variant: "progress" },
    [TaskStatus.PENDING]: { label: "대기", variant: "pending" },
    [TaskStatus.DELAYED]: { label: "지연", variant: "delayed" },
}

const priorityMap: Record<TaskPriority, { label: string; className: string }> = {
    [TaskPriority.HIGH]: { label: "높음", className: "text-red-600 bg-red-50" },
    [TaskPriority.MEDIUM]: { label: "중간", className: "text-amber-600 bg-amber-50" },
    [TaskPriority.LOW]: { label: "낮음", className: "text-slate-500 bg-slate-50" },
}

// Group tasks by phase
function groupTasksByPhase(taskList: Task[]) {
    const phases: { name: string; tasks: Task[] }[] = []
    const phaseMap = new Map<string, Task[]>()

    for (const task of taskList) {
        if (!phaseMap.has(task.phase)) {
            phaseMap.set(task.phase, [])
        }
        phaseMap.get(task.phase)!.push(task)
    }

    phaseMap.forEach((phaseTasks, name) => {
        phases.push({ name, tasks: phaseTasks })
    })

    return phases
}

function TaskRow({ task, isExpanded, onToggle, hasChildren }: {
    task: Task
    isExpanded?: boolean
    onToggle?: () => void
    hasChildren: boolean
}) {
    const status = statusMap[task.status]
    const priority = priorityMap[task.priority]

    return (
        <tr className="group border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
            <td className="py-2.5 px-4">
                <div className="flex items-center gap-1" style={{ paddingLeft: `${task.depth * 24}px` }}>
                    {hasChildren ? (
                        <button onClick={onToggle} className="p-0.5 hover:bg-slate-200 rounded transition-colors">
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                            )}
                        </button>
                    ) : (
                        <span className="w-5" />
                    )}
                    <span className={cn("text-sm font-medium", task.depth === 0 ? "text-slate-900" : "text-slate-700")}>
                        {task.title}
                    </span>
                </div>
            </td>
            <td className="py-2.5 px-4">
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 text-[10px]">
                        <AvatarFallback>{task.assignee.avatar}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-slate-700">{task.assignee.name}</span>
                </div>
            </td>
            <td className="py-2.5 px-4">
                <Badge variant={status.variant}>{status.label}</Badge>
            </td>
            <td className="py-2.5 px-4">
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded", priority.className)}>
                    {priority.label}
                </span>
            </td>
            <td className="py-2.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(task.startDate), "MM/dd")} ~ {format(parseISO(task.endDate), "MM/dd")}
                </div>
            </td>
            <td className="py-2.5 px-4">
                <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${task.progress}%`,
                                backgroundColor: task.progress === 100 ? "#10b981" : task.progress > 50 ? "#3b82f6" : "#f59e0b",
                            }}
                        />
                    </div>
                    <span className="text-xs font-medium text-slate-600 w-8 text-right">{task.progress}%</span>
                </div>
            </td>
            <td className="py-2.5 px-2">
                <button className="p-1 rounded hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </button>
            </td>
        </tr>
    )
}

function PhaseAccordion({ phase, phaseTasks }: { phase: string; phaseTasks: Task[] }) {
    const [isOpen, setIsOpen] = React.useState(true)
    const [expandedParents, setExpandedParents] = React.useState<Set<string>>(new Set())

    const completedCount = phaseTasks.filter(t => t.status === TaskStatus.COMPLETED).length
    const totalCount = phaseTasks.length

    const toggleParent = (id: string) => {
        setExpandedParents(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    // Filter visible tasks based on accordion state
    const visibleTasks = phaseTasks.filter(task => {
        if (task.depth === 0) return true
        if (task.parentId && expandedParents.has(task.parentId)) return true
        return false
    })

    return (
        <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                    <span className="font-semibold text-slate-800">{phase}</span>
                    <span className="text-xs text-slate-500 font-medium">
                        {completedCount}/{totalCount} 완료
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${totalCount > 0 ? (completedCount / totalCount * 100) : 0}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                        {totalCount > 0 ? Math.round(completedCount / totalCount * 100) : 0}%
                    </span>
                </div>
            </button>
            {isOpen && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-white">
                                <th className="py-2 px-4 font-medium text-slate-400 text-xs uppercase tracking-wider w-[30%]">업무명</th>
                                <th className="py-2 px-4 font-medium text-slate-400 text-xs uppercase tracking-wider">담당자</th>
                                <th className="py-2 px-4 font-medium text-slate-400 text-xs uppercase tracking-wider">상태</th>
                                <th className="py-2 px-4 font-medium text-slate-400 text-xs uppercase tracking-wider">우선순위</th>
                                <th className="py-2 px-4 font-medium text-slate-400 text-xs uppercase tracking-wider">일정</th>
                                <th className="py-2 px-4 font-medium text-slate-400 text-xs uppercase tracking-wider">진행률</th>
                                <th className="py-2 px-2 w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleTasks.map(task => {
                                const hasChildren = phaseTasks.some(t => t.parentId === task.id)
                                return (
                                    <TaskRow
                                        key={task.id}
                                        task={task}
                                        hasChildren={hasChildren}
                                        isExpanded={expandedParents.has(task.id)}
                                        onToggle={() => toggleParent(task.id)}
                                    />
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default function TasksPage() {
    const phases = groupTasksByPhase(tasks)
    const [activeFilter, setActiveFilter] = React.useState<string>("all")

    const filters = [
        { key: "all", label: "전체" },
        { key: TaskStatus.IN_PROGRESS, label: "진행중" },
        { key: TaskStatus.COMPLETED, label: "완료" },
        { key: TaskStatus.PENDING, label: "대기" },
        { key: TaskStatus.DELAYED, label: "지연" },
    ]

    const filteredPhases = phases.map(phase => ({
        ...phase,
        tasks: activeFilter === "all"
            ? phase.tasks
            : phase.tasks.filter(t => t.status === activeFilter),
    })).filter(p => p.tasks.length > 0)

    return (
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">작업 관리</h1>
                    <p className="text-sm text-slate-500">WBS 기반 계층 구조 업무 관리</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="업무 검색..."
                            className="h-8 w-48 rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5">
                        <Filter className="h-3.5 w-3.5" />
                        필터
                    </Button>
                    <Button size="sm" className="gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        새 업무
                    </Button>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
                {filters.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setActiveFilter(f.key)}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeFilter === f.key
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                        )}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Phase Accordions */}
            <div className="flex flex-col gap-4">
                {filteredPhases.map(phase => (
                    <PhaseAccordion key={phase.name} phase={phase.name} phaseTasks={phase.tasks} />
                ))}
            </div>
        </div>
    )
}
