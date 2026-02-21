"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, AlertTriangle, ListChecks, TrendingUp } from "lucide-react"

function GaugeChart({ value }: { value: number }) {
    const clampedValue = Math.min(100, Math.max(0, value))
    const circumference = 2 * Math.PI * 54
    const offset = circumference - (clampedValue / 100) * circumference

    return (
        <div className="relative flex items-center justify-center">
            <svg width="140" height="140" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 60 60)"
                    className="transition-all duration-1000 ease-out"
                />
                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold text-slate-900">{clampedValue}%</span>
                <span className="text-xs text-slate-500 font-medium">전체 진행률</span>
            </div>
        </div>
    )
}

interface KpiData {
    totalTasks: number
    inProgressTasks: number
    completedTasks: number
    delayedTasks: number
    overallProgress: number
}

export function KpiWidgets() {
    const [kpi, setKpi] = React.useState<KpiData>({
        totalTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        delayedTasks: 0,
        overallProgress: 0,
    })

    React.useEffect(() => {
        const run = async () => {
            const res = await fetch("/api/public/dashboard/kpi")
            if (!res.ok) return
            const data = await res.json()
            setKpi(data)
        }
        run()
    }, [])

    const kpiCards = [
        { label: "전체 작업", value: kpi.totalTasks, icon: ListChecks, color: "text-slate-700", bgColor: "bg-slate-100" },
        { label: "진행중", value: kpi.inProgressTasks, icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50" },
        { label: "완료", value: kpi.completedTasks, icon: CheckCircle2, color: "text-emerald-600", bgColor: "bg-emerald-50" },
        { label: "지연", value: kpi.delayedTasks, icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-50" },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Gauge Card */}
            <Card className="lg:col-span-1 flex flex-col items-center justify-center py-6">
                <GaugeChart value={kpi.overallProgress} />
                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <TrendingUp className="h-3 w-3" />
                    실시간 집계
                </div>
            </Card>

            {/* KPI Summary Cards */}
            {kpiCards.map((kpi) => (
                <Card key={kpi.label} className="flex flex-col justify-between">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">{kpi.label}</CardTitle>
                        <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                            <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${kpi.label === "지연" ? "text-red-600" : "text-slate-900"}`}>
                            {kpi.value}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {kpi.label === "지연" ? "즉시 대응 필요" : "전체 프로젝트 기준"}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
