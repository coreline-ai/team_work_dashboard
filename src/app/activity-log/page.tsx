"use client"

import * as React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ActivityDiffRow, ActivityLogItem } from "@/types/domain"

interface ActivityLogResponse {
  items: ActivityLogItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    byAction: Record<string, number>
  }
}

interface UserOption {
  id: string
  name: string
  role: "ADMIN" | "MEMBER"
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR")
}

function getEntityHref(item: ActivityLogItem) {
  if (item.entityType === "TASK") return "/tasks"
  if (item.entityType === "PROJECT") return "/projects"
  if (item.entityType === "USER") return "/team-members"
  return "/"
}

function DiffTypeBadge({ type }: { type: ActivityDiffRow["changeType"] }) {
  const className =
    type === "added"
      ? "bg-emerald-100 text-emerald-700"
      : type === "removed"
        ? "bg-rose-100 text-rose-700"
        : "bg-amber-100 text-amber-700"
  return <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${className}`}>{type}</span>
}

export default function ActivityLogPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const [users, setUsers] = React.useState<UserOption[]>([])
  const [logs, setLogs] = React.useState<ActivityLogResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const [actorUserId, setActorUserId] = React.useState("")
  const [entityType, setEntityType] = React.useState("")
  const [action, setAction] = React.useState("")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [page, setPage] = React.useState(1)
  const pageSize = 20

  const fetchLogs = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    if (isAdmin && actorUserId) params.set("actorUserId", actorUserId)
    if (entityType) params.set("entityType", entityType)
    if (action) params.set("action", action)
    if (from) params.set("from", new Date(from).toISOString())
    if (to) params.set("to", new Date(to).toISOString())

    const res = await fetch(`/api/activity-logs?${params.toString()}`)
    if (!res.ok) {
      setLogs(null)
      setLoading(false)
      return
    }
    setLogs(await res.json())
    setLoading(false)
  }, [action, actorUserId, entityType, from, isAdmin, page, to])

  React.useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  React.useEffect(() => {
    if (!isAdmin) return
    const run = async () => {
      const res = await fetch("/api/users")
      if (!res.ok) return
      const payload = await res.json()
      const items = (payload.users ?? []) as Array<{ id: string; name: string; role: "ADMIN" | "MEMBER" }>
      setUsers(items.map((item) => ({ id: item.id, name: item.name, role: item.role })))
    }
    run()
  }, [isAdmin])

  const onApplyFilters = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    fetchLogs()
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Activity Log</h1>
          <p className="text-sm text-slate-500">
            {isAdmin ? "팀 전체 변경 이력(필터 가능)" : "내 변경 이력"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/team-reports"><Button variant="outline">Team Reports</Button></Link>
          <Link href="/completed-projects"><Button variant="outline">Completed Projects</Button></Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">필터</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-2 md:grid-cols-6" onSubmit={onApplyFilters}>
            <select
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">전체 엔터티</option>
              <option value="TASK">TASK</option>
              <option value="PROJECT">PROJECT</option>
              <option value="USER">USER</option>
            </select>
            <input
              placeholder="Action"
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm"
            />
            {isAdmin ? (
              <select
                value={actorUserId}
                onChange={(event) => setActorUserId(event.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="">전체 사용자</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                ))}
              </select>
            ) : (
              <div className="h-9 rounded-md border border-slate-100 bg-slate-50 px-3 text-xs flex items-center text-slate-500">
                본인 이력만 조회
              </div>
            )}
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm"
            />
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm"
            />
            <div className="flex gap-2">
              <Button type="submit">조회</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setActorUserId("")
                  setEntityType("")
                  setAction("")
                  setFrom("")
                  setTo("")
                  setPage(1)
                }}
              >
                초기화
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">로그 목록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p className="text-sm text-slate-500">불러오는 중...</p> : null}
          {!loading ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-2 px-3 text-xs uppercase text-slate-500">시간</th>
                      <th className="py-2 px-3 text-xs uppercase text-slate-500">Actor</th>
                      <th className="py-2 px-3 text-xs uppercase text-slate-500">Action</th>
                      <th className="py-2 px-3 text-xs uppercase text-slate-500">Entity</th>
                      <th className="py-2 px-3 text-xs uppercase text-slate-500">링크</th>
                      <th className="py-2 px-3 text-xs uppercase text-slate-500">상세</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(logs?.items ?? []).map((item) => (
                      <React.Fragment key={item.id}>
                        <tr className="border-b border-slate-50">
                          <td className="py-2 px-3 text-slate-600">{formatDate(item.createdAt)}</td>
                          <td className="py-2 px-3 text-slate-600">{item.actor?.name ?? "Unknown"}</td>
                          <td className="py-2 px-3 font-medium text-slate-800">{item.action}</td>
                          <td className="py-2 px-3 text-slate-600">{item.entityType}:{item.entityId}</td>
                          <td className="py-2 px-3">
                            <Link href={getEntityHref(item)} className="text-blue-700 hover:underline">이동</Link>
                          </td>
                          <td className="py-2 px-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
                            >
                              {expandedId === item.id ? "닫기" : "보기"}
                            </Button>
                          </td>
                        </tr>
                        {expandedId === item.id ? (
                          <tr className="border-b border-slate-50 bg-slate-50/60">
                            <td colSpan={6} className="px-3 py-3">
                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <p className="text-xs font-semibold text-slate-600 mb-1">Before</p>
                                  <pre className="rounded bg-white border border-slate-200 p-2 text-[11px] overflow-auto">
                                    {JSON.stringify(item.before ?? {}, null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-600 mb-1">After</p>
                                  <pre className="rounded bg-white border border-slate-200 p-2 text-[11px] overflow-auto">
                                    {JSON.stringify(item.after ?? {}, null, 2)}
                                  </pre>
                                </div>
                              </div>

                              <div className="mt-3">
                                <p className="text-xs font-semibold text-slate-600 mb-1">Diff</p>
                                <div className="overflow-x-auto" data-testid="activity-diff-table">
                                  <table className="w-full text-xs border border-slate-200 bg-white">
                                    <thead>
                                      <tr className="border-b border-slate-100">
                                        <th className="py-2 px-2 text-left text-slate-500">Field</th>
                                        <th className="py-2 px-2 text-left text-slate-500">Type</th>
                                        <th className="py-2 px-2 text-left text-slate-500">Before</th>
                                        <th className="py-2 px-2 text-left text-slate-500">After</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(item.diff ?? []).map((row) => (
                                        <tr key={`${item.id}-${row.fieldPath}`} className="border-b border-slate-50">
                                          <td className="py-2 px-2 font-mono text-slate-700">{row.fieldPath}</td>
                                          <td className="py-2 px-2"><DiffTypeBadge type={row.changeType} /></td>
                                          <td className="py-2 px-2 font-mono text-slate-600 break-all">
                                            {JSON.stringify(row.beforeValue)}
                                          </td>
                                          <td className="py-2 px-2 font-mono text-slate-600 break-all">
                                            {JSON.stringify(row.afterValue)}
                                          </td>
                                        </tr>
                                      ))}
                                      {(item.diff ?? []).length === 0 ? (
                                        <tr>
                                          <td colSpan={4} className="py-2 px-2 text-slate-500">변경 필드 없음</td>
                                        </tr>
                                      ) : null}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    ))}
                    {(logs?.items ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-3 px-3 text-sm text-slate-500">표시할 로그가 없습니다.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  총 {logs?.pagination.total ?? 0}건 · 페이지 {logs?.pagination.page ?? 1}/{logs?.pagination.totalPages ?? 1}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={(logs?.pagination.page ?? 1) <= 1}
                  >
                    이전
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.min(logs?.pagination.totalPages ?? 1, prev + 1))}
                    disabled={(logs?.pagination.page ?? 1) >= (logs?.pagination.totalPages ?? 1)}
                  >
                    다음
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
