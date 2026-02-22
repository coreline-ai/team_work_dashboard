"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TeamWeeklySnapshotItem, WeeklyTeamReport } from "@/types/domain"

interface SnapshotResponse {
  items: TeamWeeklySnapshotItem[]
}

type ReportSource = "live" | "snapshot"

function getCurrentWeekStartInput() {
  const now = new Date()
  const utc = now.getTime() + 9 * 60 * 60 * 1000
  const kst = new Date(utc)
  const day = kst.getUTCDay()
  const diff = (day + 6) % 7
  kst.setUTCDate(kst.getUTCDate() - diff)
  return kst.toISOString().slice(0, 10)
}

export default function TeamReportsPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const [weekStart, setWeekStart] = React.useState(getCurrentWeekStartInput())
  const [memberId, setMemberId] = React.useState("")
  const [projectId, setProjectId] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [savingSnapshot, setSavingSnapshot] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [source, setSource] = React.useState<ReportSource>("live")
  const [selectedSnapshotId, setSelectedSnapshotId] = React.useState("")

  const [report, setReport] = React.useState<WeeklyTeamReport | null>(null)
  const [snapshots, setSnapshots] = React.useState<TeamWeeklySnapshotItem[]>([])
  const [users, setUsers] = React.useState<Array<{ id: string; name: string }>>([])
  const [projects, setProjects] = React.useState<Array<{ id: string; name: string }>>([])

  const fetchReport = React.useCallback(async (nextSource?: ReportSource) => {
    setLoading(true)
    const params = new URLSearchParams()
    const activeSource = nextSource ?? source
    if (weekStart) params.set("weekStart", weekStart)
    params.set("source", activeSource)
    if (activeSource === "live") {
      if (memberId) params.set("memberId", memberId)
      if (projectId) params.set("projectId", projectId)
    }

    const res = await fetch(`/api/team-reports/weekly?${params.toString()}`)
    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setMessage(payload?.message ?? "리포트를 불러오지 못했습니다.")
      setReport(null)
      setLoading(false)
      return
    }
    setReport(await res.json())
    setSource(activeSource)
    setLoading(false)
  }, [memberId, projectId, source, weekStart])

  const fetchSnapshots = React.useCallback(async () => {
    const res = await fetch("/api/team-reports/weekly/snapshots?limit=12")
    if (!res.ok) {
      setSnapshots([])
      return
    }
    const payload = (await res.json()) as SnapshotResponse
    setSnapshots(payload.items ?? [])
  }, [])

  const fetchOptions = React.useCallback(async () => {
    const [usersRes, projectsRes] = await Promise.all([
      fetch("/api/public/team-members"),
      fetch("/api/public/projects"),
    ])

    if (usersRes.ok) {
      const usersPayload = await usersRes.json()
      const items = (usersPayload.members ?? []) as Array<{ id: string; name: string }>
      setUsers(items)
    }

    if (projectsRes.ok) {
      const projectsPayload = await projectsRes.json()
      const items = (projectsPayload.projects ?? []) as Array<{ id: string; name: string }>
      setProjects(items)
    }
  }, [])

  React.useEffect(() => {
    fetchReport()
  }, [fetchReport])

  React.useEffect(() => {
    fetchSnapshots()
  }, [fetchSnapshots])

  React.useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  const createSnapshot = async () => {
    if (!isAdmin) return
    setSavingSnapshot(true)
    setMessage("")
    const res = await fetch("/api/team-reports/weekly/snapshots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart }),
    })
    setSavingSnapshot(false)
    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setMessage(payload?.message ?? "스냅샷 생성에 실패했습니다.")
      return
    }
    const payload = (await res.json().catch(() => null)) as { item?: TeamWeeklySnapshotItem } | null
    const snapshot = payload?.item
    setMessage("스냅샷을 생성했습니다.")
    await fetchSnapshots()
    if (snapshot) {
      setSelectedSnapshotId(snapshot.id)
      setWeekStart(snapshot.weekStart.slice(0, 10))
      await fetchReport("snapshot")
    }
  }

  const exportCsv = async () => {
    if (!isAdmin) return
    setExporting(true)
    setMessage("")
    const params = new URLSearchParams()
    if (weekStart) params.set("weekStart", weekStart)
    params.set("source", "live")

    const res = await fetch(`/api/team-reports/weekly/export?${params.toString()}`)
    setExporting(false)
    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setMessage(payload?.message ?? "CSV 내보내기에 실패했습니다.")
      return
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `team-weekly-report-${weekStart}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    setMessage("CSV를 내보냈습니다.")
  }

  const onLoadSnapshot = async (snapshot: TeamWeeklySnapshotItem) => {
    setSelectedSnapshotId(snapshot.id)
    setWeekStart(snapshot.weekStart.slice(0, 10))
    setMemberId("")
    setProjectId("")
    setMessage("")
    await fetchReport("snapshot")
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto" data-testid="team-reports-page">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team Reports</h1>
        <p className="text-sm text-slate-500">주간 리포트/SLA/스냅샷 운영</p>
        <p className="text-xs text-slate-400">현재 소스: {source === "live" ? "실시간 계산" : "스냅샷"}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">필터</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <input
            type="date"
            value={weekStart}
            onChange={(event) => {
              setWeekStart(event.target.value)
              setSource("live")
              setSelectedSnapshotId("")
            }}
            className="h-9 rounded-md border border-slate-200 px-3 text-sm"
          />
          <select
            value={memberId}
            onChange={(event) => {
              setMemberId(event.target.value)
              setSource("live")
              setSelectedSnapshotId("")
            }}
            className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white min-w-44"
          >
            <option value="">전체 멤버</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
          <select
            value={projectId}
            onChange={(event) => {
              setProjectId(event.target.value)
              setSource("live")
              setSelectedSnapshotId("")
            }}
            className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white min-w-52"
          >
            <option value="">전체 프로젝트</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <Button onClick={() => fetchReport("live")}>조회</Button>
          <Button
            variant={source === "live" ? "default" : "outline"}
            onClick={() => {
              setSelectedSnapshotId("")
              fetchReport("live")
            }}
          >
            실시간 모드
          </Button>
          {isAdmin ? (
            <>
              <Button
                data-testid="team-reports-create-snapshot"
                variant="outline"
                onClick={createSnapshot}
                disabled={savingSnapshot}
              >
                {savingSnapshot ? "생성 중..." : "스냅샷 생성"}
              </Button>
              <Button
                data-testid="team-reports-export-csv"
                variant="outline"
                onClick={exportCsv}
                disabled={exporting}
              >
                {exporting ? "내보내는 중..." : "CSV 내보내기"}
              </Button>
            </>
          ) : null}
          {message ? <span className="self-center text-xs text-slate-500">{message}</span> : null}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-5">
        <MiniStat label="총 업무" value={report?.summary.totalTasks ?? 0} />
        <MiniStat label="진행중" value={report?.summary.inProgressTasks ?? 0} />
        <MiniStat label="지연률" value={`${report?.sla.delayedRate ?? 0}%`} />
        <MiniStat label="오버듀율" value={`${report?.sla.overdueOpenRate ?? 0}%`} />
        <MiniStat label="7일 내 마감" value={report?.sla.dueSoon7dCount ?? 0} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">멤버 지표</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-slate-500">로딩 중...</p> : null}
            {!loading ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-2 px-3 text-xs uppercase text-slate-500">멤버</th>
                      <th className="py-2 px-3 text-xs uppercase text-slate-500">총</th>
                      <th className="py-2 px-3 text-xs uppercase text-slate-500">진행중</th>
                      <th className="py-2 px-3 text-xs uppercase text-slate-500">지연</th>
                      <th className="py-2 px-3 text-xs uppercase text-slate-500">완료율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report?.members ?? []).map((item) => (
                      <tr key={item.memberId} className="border-b border-slate-50">
                        <td className="py-2 px-3">{item.memberName}</td>
                        <td className="py-2 px-3">{item.totalTasks}</td>
                        <td className="py-2 px-3">{item.inProgressTasks}</td>
                        <td className="py-2 px-3">{item.delayedTasks}</td>
                        <td className="py-2 px-3">{item.completionRatio}%</td>
                      </tr>
                    ))}
                    {(report?.members ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-3 px-3 text-sm text-slate-500">데이터 없음</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">프로젝트 지표</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-slate-500">로딩 중...</p> : null}
            {!loading ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-2 px-3 text-xs uppercase text-slate-500">프로젝트</th>
                      <th className="py-2 px-3 text-xs uppercase text-slate-500">총</th>
                      <th className="py-2 px-3 text-xs uppercase text-slate-500">진행중</th>
                      <th className="py-2 px-3 text-xs uppercase text-slate-500">지연</th>
                      <th className="py-2 px-3 text-xs uppercase text-slate-500">완료율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report?.projects ?? []).map((item) => (
                      <tr key={item.projectId} className="border-b border-slate-50">
                        <td className="py-2 px-3">{item.projectName}</td>
                        <td className="py-2 px-3">{item.totalTasks}</td>
                        <td className="py-2 px-3">{item.inProgressTasks}</td>
                        <td className="py-2 px-3">{item.delayedTasks}</td>
                        <td className="py-2 px-3">{item.completionRatio}%</td>
                      </tr>
                    ))}
                    {(report?.projects ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-3 px-3 text-sm text-slate-500">데이터 없음</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">스냅샷 히스토리</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-2 px-3 text-xs uppercase text-slate-500">주차</th>
                  <th className="py-2 px-3 text-xs uppercase text-slate-500">생성자</th>
                  <th className="py-2 px-3 text-xs uppercase text-slate-500">생성일</th>
                  <th className="py-2 px-3 text-xs uppercase text-slate-500">총 업무</th>
                  <th className="py-2 px-3 text-xs uppercase text-slate-500">지연률</th>
                  <th className="py-2 px-3 text-xs uppercase text-slate-500">동작</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-50 ${selectedSnapshotId === item.id ? "bg-blue-50/40" : ""}`}
                  >
                    <td className="py-2 px-3">{item.weekStart.slice(0, 10)}</td>
                    <td className="py-2 px-3">{item.generatedBy.name}</td>
                    <td className="py-2 px-3">{new Date(item.createdAt).toLocaleString("ko-KR")}</td>
                    <td className="py-2 px-3">{item.summary.totalTasks}</td>
                    <td className="py-2 px-3">{item.sla.delayedRate}%</td>
                    <td className="py-2 px-3">
                      <Button size="sm" variant="outline" onClick={() => onLoadSnapshot(item)}>
                        로드
                      </Button>
                    </td>
                  </tr>
                ))}
                {snapshots.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-3 px-3 text-sm text-slate-500">스냅샷이 없습니다.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}
