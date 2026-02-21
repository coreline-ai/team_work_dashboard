"use client"

import * as React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { AlertTriangle, CalendarClock, FolderKanban, PlusCircle, ShieldCheck, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProjectHealth, PublicProjectOverview, PublicProjectSummary } from "@/types/domain"

interface AdminProjectItem {
  id: string
  name: string
  description?: string | null
  isArchived: boolean
  taskCount: number
}

type RiskTab = "delayed" | "dueSoon"

const healthMeta: Record<ProjectHealth, { label: string; className: string }> = {
  ON_TRACK: { label: "정상", className: "bg-emerald-100 text-emerald-700 border-transparent" },
  AT_RISK: { label: "주의", className: "bg-amber-100 text-amber-700 border-transparent" },
  CRITICAL: { label: "위험", className: "bg-rose-100 text-rose-700 border-transparent" },
}

function HealthBadge({ health }: { health: ProjectHealth }) {
  const meta = healthMeta[health]
  return <Badge className={meta.className}>{meta.label}</Badge>
}

export default function ProjectsPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const [projects, setProjects] = React.useState<PublicProjectSummary[]>([])
  const [selectedProjectId, setSelectedProjectId] = React.useState("")
  const [overview, setOverview] = React.useState<PublicProjectOverview | null>(null)
  const [loadingProjects, setLoadingProjects] = React.useState(true)
  const [loadingOverview, setLoadingOverview] = React.useState(false)
  const [riskTab, setRiskTab] = React.useState<RiskTab>("delayed")

  const [adminProjects, setAdminProjects] = React.useState<AdminProjectItem[]>([])
  const [adminProjectId, setAdminProjectId] = React.useState("")
  const [createName, setCreateName] = React.useState("")
  const [createDescription, setCreateDescription] = React.useState("")
  const [editName, setEditName] = React.useState("")
  const [editDescription, setEditDescription] = React.useState("")
  const [editArchived, setEditArchived] = React.useState(false)
  const [adminMessage, setAdminMessage] = React.useState("")
  const [adminLoading, setAdminLoading] = React.useState(false)

  const fetchProjects = React.useCallback(async () => {
    setLoadingProjects(true)
    const res = await fetch("/api/public/projects")
    if (!res.ok) {
      setProjects([])
      setLoadingProjects(false)
      return
    }

    const payload = await res.json()
    const nextProjects: PublicProjectSummary[] = payload.projects ?? []
    setProjects(nextProjects)

    setSelectedProjectId((prev) => {
      if (prev && nextProjects.some((project) => project.id === prev)) return prev
      return nextProjects[0]?.id ?? ""
    })
    setLoadingProjects(false)
  }, [])

  const fetchOverview = React.useCallback(async (projectId: string) => {
    if (!projectId) {
      setOverview(null)
      return
    }

    setLoadingOverview(true)
    const res = await fetch(`/api/public/projects/${projectId}/overview`)
    if (!res.ok) {
      setOverview(null)
      setLoadingOverview(false)
      return
    }

    setOverview(await res.json())
    setLoadingOverview(false)
  }, [])

  const fetchAdminProjects = React.useCallback(async () => {
    if (!isAdmin) return

    const res = await fetch("/api/projects?includeArchived=true")
    if (!res.ok) {
      setAdminProjects([])
      return
    }

    const payload = await res.json()
    const next: AdminProjectItem[] = payload.projects ?? []
    setAdminProjects(next)

    setAdminProjectId((prev) => {
      if (prev && next.some((project) => project.id === prev)) return prev
      if (selectedProjectId && next.some((project) => project.id === selectedProjectId)) return selectedProjectId
      return next[0]?.id ?? ""
    })
  }, [isAdmin, selectedProjectId])

  React.useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  React.useEffect(() => {
    fetchOverview(selectedProjectId)
  }, [fetchOverview, selectedProjectId])

  React.useEffect(() => {
    fetchAdminProjects()
  }, [fetchAdminProjects])

  React.useEffect(() => {
    if (!isAdmin || !adminProjectId) return

    const current = adminProjects.find((project) => project.id === adminProjectId)
    if (!current) return

    setEditName(current.name)
    setEditDescription(current.description ?? "")
    setEditArchived(current.isArchived)
  }, [adminProjectId, adminProjects, isAdmin])

  const onCreateProject = async () => {
    if (!isAdmin || !createName.trim()) return

    setAdminLoading(true)
    setAdminMessage("")
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName.trim(), description: createDescription.trim() || null }),
    })
    setAdminLoading(false)

    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setAdminMessage(payload?.message ?? "프로젝트 생성에 실패했습니다.")
      return
    }

    setCreateName("")
    setCreateDescription("")
    setAdminMessage("프로젝트가 생성되었습니다.")
    await Promise.all([fetchProjects(), fetchAdminProjects()])
  }

  const onUpdateProject = async () => {
    if (!isAdmin || !adminProjectId || !editName.trim()) return

    setAdminLoading(true)
    setAdminMessage("")
    const res = await fetch(`/api/projects/${adminProjectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        description: editDescription.trim() || null,
        isArchived: editArchived,
      }),
    })
    setAdminLoading(false)

    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setAdminMessage(payload?.message ?? "프로젝트 수정에 실패했습니다.")
      return
    }

    setAdminMessage("프로젝트가 수정되었습니다.")
    await Promise.all([fetchProjects(), fetchAdminProjects(), fetchOverview(selectedProjectId)])
  }

  const selectedSummary = projects.find((project) => project.id === selectedProjectId)
  const activeRisks = riskTab === "delayed" ? overview?.risks.delayed ?? [] : overview?.risks.dueSoon ?? []

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">프로젝트</h1>
        <p className="text-sm text-slate-500">헬스 상태, 리스크, 타임라인 기반 프로젝트 운영</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[340px,1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-slate-500" />
              프로젝트 목록
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingProjects ? <p className="text-sm text-slate-500">프로젝트를 불러오는 중...</p> : null}
            {!loadingProjects && projects.length === 0 ? <p className="text-sm text-slate-500">표시할 프로젝트가 없습니다.</p> : null}
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`w-full rounded-md border px-3 py-3 text-left transition-colors ${
                  selectedProjectId === project.id
                    ? "border-blue-300 bg-blue-50/50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-800">{project.name}</p>
                  <HealthBadge health={project.health} />
                </div>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{project.description ?? "설명 없음"}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">전체 {project.totalTasks}</span>
                  <span className="rounded bg-rose-50 px-2 py-1 text-rose-700">지연 {project.delayedTasks}</span>
                  <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">진행률 {project.overallProgress}%</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">프로젝트 개요</CardTitle>
                {selectedProjectId ? (
                  <div className="flex gap-2">
                    <Link href={`/tasks?projectId=${selectedProjectId}`}>
                      <Button variant="outline" size="sm">Tasks로 보기</Button>
                    </Link>
                    <Link href={`/projects/${selectedProjectId}`}>
                      <Button size="sm">상세 페이지</Button>
                    </Link>
                  </div>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {loadingOverview ? <p className="text-sm text-slate-500">상세를 불러오는 중...</p> : null}
              {!loadingOverview && !overview ? <p className="text-sm text-slate-500">프로젝트를 선택해주세요.</p> : null}
              {!loadingOverview && overview ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">{overview.project.name}</h2>
                    <HealthBadge health={overview.health} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <MiniStat label="전체" value={overview.kpi.totalTasks} />
                    <MiniStat label="완료" value={overview.kpi.completedTasks} valueClassName="text-emerald-600" />
                    <MiniStat label="진행중" value={overview.kpi.inProgressTasks} valueClassName="text-blue-600" />
                    <MiniStat label="지연" value={overview.kpi.delayedTasks} valueClassName="text-rose-600" />
                    <MiniStat label="진행률" value={`${overview.kpi.overallProgress}%`} />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="py-2 px-3 text-xs uppercase text-slate-500">Phase</th>
                          <th className="py-2 px-3 text-xs uppercase text-slate-500">전체</th>
                          <th className="py-2 px-3 text-xs uppercase text-slate-500">완료</th>
                          <th className="py-2 px-3 text-xs uppercase text-slate-500">지연</th>
                          <th className="py-2 px-3 text-xs uppercase text-slate-500">진행률</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.phaseSummary.map((phase) => (
                          <tr key={phase.phase} className="border-b border-slate-50 hover:bg-slate-50/80">
                            <td className="py-2 px-3">
                              <Link
                                href={`/tasks?projectId=${overview.project.id}&phase=${encodeURIComponent(phase.phase)}`}
                                className="font-medium text-blue-700 hover:underline"
                              >
                                {phase.phase}
                              </Link>
                            </td>
                            <td className="py-2 px-3 text-slate-700">{phase.total}</td>
                            <td className="py-2 px-3 text-emerald-600">{phase.completed}</td>
                            <td className="py-2 px-3 text-rose-600">{phase.delayed}</td>
                            <td className="py-2 px-3 text-slate-600">{phase.progress}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
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
                {!overview ? <p className="text-sm text-slate-500">데이터 없음</p> : null}
                {overview ? (
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
                    {overview.timeline.length === 0 ? <p className="text-sm text-slate-500">타임라인 데이터가 없습니다.</p> : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-slate-500" />
                    리스크
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button size="sm" variant={riskTab === "delayed" ? "default" : "outline"} onClick={() => setRiskTab("delayed")}>지연</Button>
                    <Button size="sm" variant={riskTab === "dueSoon" ? "default" : "outline"} onClick={() => setRiskTab("dueSoon")}>마감임박</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!overview ? <p className="text-sm text-slate-500">데이터 없음</p> : null}
                {overview ? (
                  <div className="space-y-2">
                    {activeRisks.map((risk) => (
                      <Link
                        key={risk.id}
                        href={`/tasks?projectId=${overview.project.id}&q=${encodeURIComponent(risk.title)}`}
                        className="block rounded border border-slate-200 px-3 py-2 hover:bg-slate-50"
                      >
                        <p className="text-sm font-medium text-slate-800">{risk.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {risk.assigneeName} · {risk.priority} · {risk.endDate.slice(0, 10)}
                        </p>
                      </Link>
                    ))}
                    {activeRisks.length === 0 ? <p className="text-sm text-slate-500">리스크 항목이 없습니다.</p> : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              관리자 프로젝트 운영
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                <PlusCircle className="h-4 w-4" />
                프로젝트 생성
              </p>
              <div className="grid gap-2 md:grid-cols-3">
                <input
                  placeholder="프로젝트명"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  className="h-9 rounded-md border border-slate-200 px-3 text-sm"
                />
                <input
                  placeholder="설명"
                  value={createDescription}
                  onChange={(event) => setCreateDescription(event.target.value)}
                  className="h-9 rounded-md border border-slate-200 px-3 text-sm"
                />
                <Button onClick={onCreateProject} disabled={adminLoading}>생성</Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                <Target className="h-4 w-4" />
                프로젝트 수정/아카이브
              </p>
              <div className="grid gap-2 md:grid-cols-4">
                <select
                  value={adminProjectId}
                  onChange={(event) => setAdminProjectId(event.target.value)}
                  className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white"
                >
                  <option value="">프로젝트 선택</option>
                  {adminProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}{project.isArchived ? " (ARCHIVED)" : ""}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="프로젝트명"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="h-9 rounded-md border border-slate-200 px-3 text-sm"
                />
                <input
                  placeholder="설명"
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  className="h-9 rounded-md border border-slate-200 px-3 text-sm"
                />
                <label className="h-9 inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={editArchived}
                    onChange={(event) => setEditArchived(event.target.checked)}
                  />
                  아카이브
                </label>
              </div>
              <div className="flex gap-2">
                <Button onClick={onUpdateProject} disabled={adminLoading || !adminProjectId}>저장</Button>
                {adminMessage ? <span className="text-xs text-slate-500 self-center">{adminMessage}</span> : null}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {selectedSummary ? (
        <div className="text-xs text-slate-500">선택 프로젝트: {selectedSummary.name}</div>
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
