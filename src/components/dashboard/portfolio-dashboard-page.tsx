"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { KpiWidgets } from "@/components/dashboard/kpi-widgets"
import { WeeklyComboChart } from "@/components/dashboard/weekly-combo-chart"
import { StatusPieChart } from "@/components/dashboard/status-pie-chart"
import { RecentActivityTable } from "@/components/dashboard/recent-activity-table"
import type { PortfolioDashboardOverview, ProjectHealth } from "@/types/domain"

const healthMeta: Record<ProjectHealth, { label: string; className: string }> = {
  ON_TRACK: { label: "정상", className: "bg-emerald-100 text-emerald-700 border-transparent" },
  AT_RISK: { label: "주의", className: "bg-amber-100 text-amber-700 border-transparent" },
  CRITICAL: { label: "위험", className: "bg-rose-100 text-rose-700 border-transparent" },
}

function HealthBadge({ health }: { health: ProjectHealth }) {
  const meta = healthMeta[health]
  return <Badge className={meta.className}>{meta.label}</Badge>
}

export function PortfolioDashboardPage() {
  const [overview, setOverview] = React.useState<PortfolioDashboardOverview | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const run = async () => {
      setLoading(true)
      const res = await fetch("/api/public/dashboard/portfolio/overview")
      if (!res.ok) {
        setOverview(null)
        setLoading(false)
        return
      }
      setOverview(await res.json())
      setLoading(false)
    }
    run()
  }, [])

  if (loading) {
    return <div className="w-full max-w-7xl mx-auto text-sm text-slate-500">대시보드를 불러오는 중...</div>
  }

  if (!overview) {
    return <div className="w-full max-w-7xl mx-auto text-sm text-slate-500">대시보드 데이터를 불러오지 못했습니다.</div>
  }

  const healthCounts = overview.projectHealth.reduce(
    (acc, project) => {
      if (project.health === "ON_TRACK") acc.onTrack += 1
      if (project.health === "AT_RISK") acc.atRisk += 1
      if (project.health === "CRITICAL") acc.critical += 1
      return acc
    },
    { onTrack: 0, atRisk: 0, critical: 0 },
  )

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardContent className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Portfolio Dashboard</p>
              <h1 className="text-2xl font-bold tracking-tight">멀티 프로젝트 운영 현황</h1>
              <p className="text-sm text-blue-100">전체 프로젝트 진행률과 리스크를 한 번에 모니터링합니다.</p>
            </div>
            <Link href="/projects">
              <Button variant="secondary" className="gap-1">
                프로젝트 운영
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <div className="rounded-md bg-white/15 px-3 py-2">
              <p className="text-xs text-blue-100">활성 프로젝트</p>
              <p className="text-2xl font-semibold">{overview.projectHealth.length}</p>
            </div>
            <div className="rounded-md bg-emerald-500/30 px-3 py-2">
              <p className="text-xs text-emerald-100">정상</p>
              <p className="text-2xl font-semibold">{healthCounts.onTrack}</p>
            </div>
            <div className="rounded-md bg-amber-500/30 px-3 py-2">
              <p className="text-xs text-amber-100">주의</p>
              <p className="text-2xl font-semibold">{healthCounts.atRisk}</p>
            </div>
            <div className="rounded-md bg-rose-500/30 px-3 py-2">
              <p className="text-xs text-rose-100">위험</p>
              <p className="text-2xl font-semibold">{healthCounts.critical}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <KpiWidgets />

      <div className="grid gap-4 xl:grid-cols-7">
        <WeeklyComboChart />
        <StatusPieChart />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">프로젝트별 헬스 맵</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {overview.projectHealth.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="rounded-md border border-slate-200 px-3 py-3 hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">{project.name}</p>
                <HealthBadge health={project.health} />
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${project.overallProgress}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>진행률 {project.overallProgress}%</span>
                <span className="inline-flex items-center gap-1">
                  {project.health === "ON_TRACK" ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> : null}
                  {project.health === "AT_RISK" ? <ShieldAlert className="h-3.5 w-3.5 text-amber-600" /> : null}
                  {project.health === "CRITICAL" ? <ShieldX className="h-3.5 w-3.5 text-rose-600" /> : null}
                  지연 {project.delayedTasks}
                </span>
              </div>
            </Link>
          ))}
          {overview.projectHealth.length === 0 ? <p className="text-sm text-slate-500">표시할 프로젝트가 없습니다.</p> : null}
        </CardContent>
      </Card>

      <RecentActivityTable />
    </div>
  )
}
