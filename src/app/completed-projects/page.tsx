"use client"

import * as React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminMode } from "@/components/providers/admin-mode-provider"
import type { ProjectCompletionHistoryItem, ProjectCompletionSummary } from "@/types/domain"

interface CompletedProjectsPayload {
  projects: ProjectCompletionSummary[]
  history: ProjectCompletionHistoryItem[]
  summary: {
    totalCompletedProjects: number
    completedIn30Days: number
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR")
}

export default function CompletedProjectsPage() {
  const { data: session } = useSession()
  const { enabled: adminModeEnabled } = useAdminMode()
  const isAdmin = session?.user?.role === "ADMIN"
  const showAdminActions = isAdmin && adminModeEnabled

  const [payload, setPayload] = React.useState<CompletedProjectsPayload | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [reopening, setReopening] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState("")

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/projects/completed")
    if (!res.ok) {
      setPayload(null)
      setLoading(false)
      return
    }
    setPayload(await res.json())
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const onReopen = async (projectId: string) => {
    setReopening(projectId)
    setMessage("")
    const res = await fetch(`/api/projects/${projectId}/reopen`, { method: "PATCH" })
    setReopening(null)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setMessage(body?.message ?? "프로젝트 재개에 실패했습니다.")
      return
    }
    setMessage("프로젝트가 재개되었습니다.")
    await fetchData()
  }

  const historyByProject = React.useMemo(() => {
    const map = new Map<string, ProjectCompletionHistoryItem[]>()
    for (const item of payload?.history ?? []) {
      const arr = map.get(item.projectId) ?? []
      arr.push(item)
      map.set(item.projectId, arr)
    }
    return map
  }, [payload?.history])

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Completed Projects</h1>
          <p className="text-sm text-slate-500">완료 프로젝트 관리와 완료/재개 이력 추적</p>
        </div>
        <Link href="/projects">
          <Button variant="outline">프로젝트로 이동</Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">전체 완료 프로젝트</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-slate-900">{payload?.summary.totalCompletedProjects ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">최근 30일 완료</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-slate-900">{payload?.summary.completedIn30Days ?? 0}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">완료 프로젝트 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-slate-500">불러오는 중...</p> : null}
          {!loading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-2 px-3 text-xs uppercase text-slate-500">프로젝트</th>
                    <th className="py-2 px-3 text-xs uppercase text-slate-500">완료일</th>
                    <th className="py-2 px-3 text-xs uppercase text-slate-500">완료자</th>
                    <th className="py-2 px-3 text-xs uppercase text-slate-500">노트</th>
                    <th className="py-2 px-3 text-xs uppercase text-slate-500">Task</th>
                    <th className="py-2 px-3 text-xs uppercase text-slate-500">진행률</th>
                    <th className="py-2 px-3 text-xs uppercase text-slate-500">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {(payload?.projects ?? []).map((project) => (
                    <tr key={project.id} className="border-b border-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-800">{project.name}</td>
                      <td className="py-2 px-3 text-slate-600">{formatDate(project.completedAt)}</td>
                      <td className="py-2 px-3 text-slate-600">{project.completedBy?.name ?? "-"}</td>
                      <td className="py-2 px-3 text-slate-600">{project.completionNote ?? "-"}</td>
                      <td className="py-2 px-3 text-slate-600">{project.completedTasks}/{project.totalTasks}</td>
                      <td className="py-2 px-3 text-slate-700">{project.overallProgress}%</td>
                      <td className="py-2 px-3">
                        {showAdminActions ? (
                          <Button
                            size="sm"
                            onClick={() => onReopen(project.id)}
                            disabled={reopening === project.id}
                          >
                            {reopening === project.id ? "재개 중..." : "재개"}
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">조회 전용</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(payload?.projects ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-3 px-3 text-sm text-slate-500">완료 프로젝트가 없습니다.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : null}
          {message ? <p className="mt-3 text-xs text-slate-500">{message}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">완료/재개 히스토리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(payload?.projects ?? []).map((project) => {
            const history = historyByProject.get(project.id) ?? []
            return (
              <div key={`history-${project.id}`} className="rounded-md border border-slate-200 p-3">
                <p className="font-semibold text-slate-800">{project.name}</p>
                <div className="mt-2 space-y-2">
                  {history.map((event) => (
                    <div key={event.id} className="text-xs text-slate-600 rounded bg-slate-50 px-2 py-1">
                      <span className="font-medium text-slate-700">{event.action}</span>
                      {" · "}
                      <span>{event.actor?.name ?? "Unknown"}</span>
                      {" · "}
                      <span>{formatDate(event.createdAt)}</span>
                    </div>
                  ))}
                  {history.length === 0 ? <p className="text-xs text-slate-400">히스토리가 없습니다.</p> : null}
                </div>
              </div>
            )
          })}
          {(payload?.projects ?? []).length === 0 ? <p className="text-sm text-slate-500">표시할 히스토리가 없습니다.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
