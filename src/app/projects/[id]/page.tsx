"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AlertTriangle, CalendarClock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProjectHealth, PublicProjectOverview } from "@/types/domain"

const healthMeta: Record<ProjectHealth, { label: string; className: string }> = {
  ON_TRACK: { label: "정상", className: "bg-emerald-100 text-emerald-700 border-transparent" },
  AT_RISK: { label: "주의", className: "bg-amber-100 text-amber-700 border-transparent" },
  CRITICAL: { label: "위험", className: "bg-rose-100 text-rose-700 border-transparent" },
}

function HealthBadge({ health }: { health: ProjectHealth }) {
  const meta = healthMeta[health]
  return <Badge className={meta.className}>{meta.label}</Badge>
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const projectId = params?.id

  const [overview, setOverview] = React.useState<PublicProjectOverview | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!projectId) return

    const run = async () => {
      setLoading(true)
      const res = await fetch(`/api/public/projects/${projectId}/overview`)
      if (!res.ok) {
        setOverview(null)
        setLoading(false)
        return
      }

      setOverview(await res.json())
      setLoading(false)
    }

    run()
  }, [projectId])

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">프로젝트 상세</h1>
          <p className="text-sm text-slate-500">프로젝트 KPI, 리스크, 타임라인</p>
        </div>
        <Link href="/projects">
          <Button variant="outline" size="sm">목록으로</Button>
        </Link>
      </div>

      {loading ? <p className="text-sm text-slate-500">상세를 불러오는 중...</p> : null}
      {!loading && !overview ? <p className="text-sm text-slate-500">프로젝트를 찾을 수 없습니다.</p> : null}

      {overview ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{overview.project.name}</CardTitle>
                <HealthBadge health={overview.health} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <MiniStat label="전체" value={overview.kpi.totalTasks} />
                <MiniStat label="완료" value={overview.kpi.completedTasks} valueClassName="text-emerald-600" />
                <MiniStat label="진행중" value={overview.kpi.inProgressTasks} valueClassName="text-blue-600" />
                <MiniStat label="지연" value={overview.kpi.delayedTasks} valueClassName="text-rose-600" />
                <MiniStat label="진행률" value={`${overview.kpi.overallProgress}%`} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-slate-500" />
                  타임라인
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overview.timeline.map((item) => {
                    const progress = item.totalTasks === 0 ? 0 : Math.round((item.completedTasks / item.totalTasks) * 100)
                    return (
                      <div key={item.phase} className="rounded border border-slate-200 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">{item.phase}</p>
                          <p className="text-xs text-slate-500">{item.startDate.slice(0, 10)} ~ {item.endDate.slice(0, 10)}</p>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">완료 {item.completedTasks}/{item.totalTasks} ({progress}%)</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-slate-500" />
                  리스크
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <section>
                    <p className="mb-2 text-sm font-semibold text-slate-800">지연 Top 5</p>
                    <div className="space-y-2">
                      {overview.risks.delayed.map((risk) => (
                        <Link
                          key={risk.id}
                          href={`/tasks?projectId=${overview.project.id}&q=${encodeURIComponent(risk.title)}`}
                          className="block rounded border border-slate-200 px-3 py-2 hover:bg-slate-50"
                        >
                          <p className="text-sm font-medium text-slate-800">{risk.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{risk.assigneeName} · {risk.priority} · {risk.endDate.slice(0, 10)}</p>
                        </Link>
                      ))}
                      {overview.risks.delayed.length === 0 ? <p className="text-xs text-slate-500">지연 항목 없음</p> : null}
                    </div>
                  </section>

                  <section>
                    <p className="mb-2 text-sm font-semibold text-slate-800">마감임박 Top 5</p>
                    <div className="space-y-2">
                      {overview.risks.dueSoon.map((risk) => (
                        <Link
                          key={risk.id}
                          href={`/tasks?projectId=${overview.project.id}&q=${encodeURIComponent(risk.title)}`}
                          className="block rounded border border-slate-200 px-3 py-2 hover:bg-slate-50"
                        >
                          <p className="text-sm font-medium text-slate-800">{risk.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{risk.assigneeName} · {risk.priority} · {risk.endDate.slice(0, 10)}</p>
                        </Link>
                      ))}
                      {overview.risks.dueSoon.length === 0 ? <p className="text-xs text-slate-500">마감임박 항목 없음</p> : null}
                    </div>
                  </section>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}

function MiniStat({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: number | string
  valueClassName?: string
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-semibold ${valueClassName ?? "text-slate-900"}`}>{value}</p>
    </div>
  )
}