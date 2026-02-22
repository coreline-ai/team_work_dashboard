"use client"

import * as React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, CircleDashed, Clock3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminMode } from "@/components/providers/admin-mode-provider"
import { getRoleLabel } from "@/lib/role-label"
import type {
  MemberExecutionTask,
  PublicTeamMember,
  Role,
  TeamMembersExecutionResponse,
} from "@/types/domain"

interface TeamUser {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
}

interface ProjectOption {
  id: string
  name: string
}

const emptyCreateForm = {
  name: "",
  email: "",
  password: "",
  role: "MEMBER" as Role,
}

const statusMeta = {
  IN_PROGRESS: { label: "진행중", variant: "progress" as const, icon: Clock3 },
  DELAYED: { label: "지연", variant: "delayed" as const, icon: AlertTriangle },
  PENDING: { label: "대기", variant: "pending" as const, icon: CircleDashed },
  COMPLETED: { label: "완료", variant: "completed" as const, icon: CheckCircle2 },
}

const priorityLabel: Record<"HIGH" | "MEDIUM" | "LOW", string> = {
  HIGH: "높음",
  MEDIUM: "중간",
  LOW: "낮음",
}

function StatusBadge({ status }: { status: MemberExecutionTask["status"] }) {
  const meta = statusMeta[status]
  const Icon = meta.icon

  return (
    <Badge variant={meta.variant} className="gap-1">
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </Badge>
  )
}

function formatDate(iso: string) {
  return iso.slice(0, 10)
}

export default function TeamMembersPage() {
  const { data: session, status } = useSession()
  const { enabled: adminModeEnabled } = useAdminMode()
  const isAuthenticated = status === "authenticated"
  const isAdmin = session?.user?.role === "ADMIN"
  const showAdminControls = isAdmin && adminModeEnabled

  const [query, setQuery] = React.useState("")
  const [projectFilter, setProjectFilter] = React.useState("")

  const [publicMembers, setPublicMembers] = React.useState<PublicTeamMember[]>([])
  const [publicLoading, setPublicLoading] = React.useState(true)

  const [execution, setExecution] = React.useState<TeamMembersExecutionResponse | null>(null)
  const [executionLoading, setExecutionLoading] = React.useState(false)
  const [expandedMembers, setExpandedMembers] = React.useState<Record<string, boolean>>({})
  const [projectSortMode, setProjectSortMode] = React.useState<"DUE_SOON" | "PROGRESS">("DUE_SOON")

  const [projectOptions, setProjectOptions] = React.useState<ProjectOption[]>([])

  const [adminUsers, setAdminUsers] = React.useState<TeamUser[]>([])
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
  const [message, setMessage] = React.useState("")
  const [createForm, setCreateForm] = React.useState(emptyCreateForm)

  const fetchPublicMembers = React.useCallback(async () => {
    setPublicLoading(true)
    const res = await fetch("/api/public/team-members")
    if (!res.ok) {
      setPublicMembers([])
      setPublicLoading(false)
      return
    }
    const payload = await res.json()
    setPublicMembers(payload.members ?? [])
    setPublicLoading(false)
  }, [])

  const fetchProjectOptions = React.useCallback(async () => {
    const res = await fetch("/api/public/projects")
    if (!res.ok) return
    const payload = await res.json()
    const options = (payload.projects ?? []) as Array<{ id: string; name: string }>
    setProjectOptions(options.map((item) => ({ id: item.id, name: item.name })))
  }, [])

  const fetchExecution = React.useCallback(async () => {
    if (!isAuthenticated) {
      setExecution(null)
      return
    }

    setExecutionLoading(true)
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (projectFilter) params.set("projectId", projectFilter)
    params.set("limitPerProject", "20")

    const res = await fetch(`/api/team-members/execution?${params.toString()}`)
    if (!res.ok) {
      setExecution(null)
      setExecutionLoading(false)
      return
    }
    setExecution(await res.json())
    setExecutionLoading(false)
  }, [isAuthenticated, projectFilter, query])

  const fetchAdminUsers = React.useCallback(async () => {
    if (!showAdminControls) return
    const res = await fetch("/api/users")
    if (!res.ok) return
    const payload = await res.json()
    setAdminUsers(payload.users ?? [])
  }, [showAdminControls])

  React.useEffect(() => {
    fetchPublicMembers()
    fetchProjectOptions()
  }, [fetchProjectOptions, fetchPublicMembers])

  React.useEffect(() => {
    fetchExecution()
  }, [fetchExecution])

  React.useEffect(() => {
    if (status !== "authenticated" || !showAdminControls) return
    fetchAdminUsers()
  }, [status, showAdminControls, fetchAdminUsers])

  const createUser = async () => {
    if (!showAdminControls) return
    setMessage("")
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setMessage(payload?.message ?? "팀원 생성에 실패했습니다.")
      return
    }
    setCreateForm(emptyCreateForm)
    setMessage("팀원이 생성되었습니다.")
    fetchAdminUsers()
    fetchPublicMembers()
    fetchExecution()
  }

  const updateUser = async (id: string, patch: Partial<Pick<TeamUser, "role" | "isActive">>) => {
    if (!showAdminControls) return
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setMessage(payload?.message ?? "팀원 수정에 실패했습니다.")
      return
    }
    fetchAdminUsers()
    fetchPublicMembers()
    fetchExecution()
  }

  const deactivateUser = async (id: string) => {
    if (!showAdminControls) return
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setMessage(payload?.message ?? "비활성화에 실패했습니다.")
      return
    }
    fetchAdminUsers()
    fetchPublicMembers()
    fetchExecution()
  }

  const filteredPublicMembers = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return publicMembers.filter((member) => {
      const nameMatch = q.length === 0 || member.name.toLowerCase().includes(q)
      const projectMatch =
        !projectFilter ||
        (member.projectBuckets ?? []).some((bucket) => bucket.projectId === projectFilter)
      return nameMatch && projectMatch
    })
  }, [projectFilter, publicMembers, query])

  const filteredAdminUsers = adminUsers.filter((user) => {
    const statusMatched =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && user.isActive) ||
      (statusFilter === "INACTIVE" && !user.isActive)
    const queryLower = query.trim().toLowerCase()
    const queryMatched =
      queryLower.length === 0 ||
      user.name.toLowerCase().includes(queryLower) ||
      user.email.toLowerCase().includes(queryLower)
    return statusMatched && queryMatched
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">팀 멤버</h1>
        <p className="text-sm text-slate-500">팀장/팀원별 프로젝트 수행중 테스트 항목 통합 조회</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">필터</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="멤버명 또는 업무/phase 검색"
            className="h-9 rounded-md border border-slate-200 px-3 text-sm min-w-64"
          />
          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white min-w-56"
          >
            <option value="">전체 프로젝트</option>
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <div className="h-9 inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 text-xs text-blue-700">
            진행중(IN_PROGRESS) 항목 고정
          </div>
        </CardContent>
      </Card>

      <Card data-testid="team-public-summary">
        <CardHeader>
          <CardTitle className="text-base">멤버 요약 (공개)</CardTitle>
        </CardHeader>
        <CardContent>
          {publicLoading ? <p className="text-sm text-slate-500">멤버 정보를 불러오는 중...</p> : null}
          {!publicLoading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 px-4 text-xs uppercase text-slate-500">이름</th>
                    <th className="py-3 px-4 text-xs uppercase text-slate-500">역할</th>
                    <th className="py-3 px-4 text-xs uppercase text-slate-500">진행중</th>
                    <th className="py-3 px-4 text-xs uppercase text-slate-500">프로젝트</th>
                    <th className="py-3 px-4 text-xs uppercase text-slate-500">대표 항목</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPublicMembers.map((member) => (
                    <tr key={member.id} className="border-b border-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-800">{member.name}</td>
                      <td className="py-3 px-4 text-slate-600">{getRoleLabel(member.role)}</td>
                      <td className="py-3 px-4 text-blue-700 font-medium">{member.inProgressCount}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(member.projectBuckets ?? []).slice(0, 4).map((bucket) => (
                            <span
                              key={`${member.id}-${bucket.projectId}`}
                              className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                            >
                              {bucket.projectName} ({bucket.inProgress})
                            </span>
                          ))}
                          {(member.projectBuckets ?? []).length === 0 ? (
                            <span className="text-xs text-slate-400">미배정</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {member.topTaskTitles.map((title) => (
                            <span
                              key={`${member.id}-${title}`}
                              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                            >
                              {title}
                            </span>
                          ))}
                          {member.topTaskTitles.length === 0 ? (
                            <span className="text-xs text-slate-400">진행중 항목 없음</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPublicMembers.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">조건에 맞는 멤버가 없습니다.</p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isAuthenticated ? (
        <Card data-testid="team-execution-section">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">수행중 테스트 항목 상세 (로그인)</CardTitle>
              <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1">
                <Button
                  data-testid="team-exec-sort-due-soon"
                  type="button"
                  size="sm"
                  variant={projectSortMode === "DUE_SOON" ? "default" : "outline"}
                  onClick={() => setProjectSortMode("DUE_SOON")}
                  aria-pressed={projectSortMode === "DUE_SOON"}
                >
                  마감 임박순
                </Button>
                <Button
                  data-testid="team-exec-sort-progress"
                  type="button"
                  size="sm"
                  variant={projectSortMode === "PROGRESS" ? "default" : "outline"}
                  onClick={() => setProjectSortMode("PROGRESS")}
                  aria-pressed={projectSortMode === "PROGRESS"}
                >
                  진행률순
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat label="멤버 수" value={execution?.summary.members ?? 0} />
              <MiniStat label="프로젝트 수" value={execution?.summary.projects ?? 0} />
              <MiniStat label="진행중 항목" value={execution?.summary.inProgressTasks ?? 0} />
            </div>

            {executionLoading ? <p className="text-sm text-slate-500">상세 데이터를 불러오는 중...</p> : null}
            {!executionLoading && (execution?.members ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">표시할 수행중 테스트 항목이 없습니다.</p>
            ) : null}

            {!executionLoading ? (
              <div className="space-y-3">
                {(execution?.members ?? []).map((member) => {
                  const expanded = Boolean(expandedMembers[member.memberId])
                  const sortedProjects = [...member.projects].sort((a, b) => {
                    if (projectSortMode === "PROGRESS") {
                      const aAvg =
                        a.tasks.length === 0
                          ? 0
                          : Math.round(a.tasks.reduce((sum, task) => sum + task.progress, 0) / a.tasks.length)
                      const bAvg =
                        b.tasks.length === 0
                          ? 0
                          : Math.round(b.tasks.reduce((sum, task) => sum + task.progress, 0) / b.tasks.length)
                      if (bAvg !== aAvg) return bAvg - aAvg
                      return b.inProgressCount - a.inProgressCount
                    }

                    const aDue = a.tasks.reduce((min, task) => {
                      const end = new Date(task.endDate).getTime()
                      return end < min ? end : min
                    }, Number.POSITIVE_INFINITY)
                    const bDue = b.tasks.reduce((min, task) => {
                      const end = new Date(task.endDate).getTime()
                      return end < min ? end : min
                    }, Number.POSITIVE_INFINITY)
                    if (aDue !== bDue) return aDue - bDue
                    return b.inProgressCount - a.inProgressCount
                  })
                  return (
                    <div key={member.memberId} className="rounded-lg border border-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            data-testid={`team-exec-member-toggle-${member.memberId}`}
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setExpandedMembers((prev) => ({
                                ...prev,
                                [member.memberId]: !prev[member.memberId],
                              }))
                            }
                          >
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                          <div>
                            <p className="font-semibold text-slate-800">{member.memberName}</p>
                            <p className="text-xs text-slate-500">{getRoleLabel(member.role)}</p>
                          </div>
                        </div>
                        <div className="text-sm text-blue-700 font-semibold">진행중 {member.totalInProgress}건</div>
                      </div>

                      {expanded ? (
                        <div className="p-3 space-y-3">
                          {sortedProjects.map((project) => (
                            <section
                              key={`${member.memberId}-${project.projectId}`}
                              className="rounded-md border border-slate-200 overflow-hidden"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-white px-3 py-2">
                                <div>
                                  <p className="font-medium text-slate-800">{project.projectName}</p>
                                  <p className="text-xs text-slate-500">
                                    진행중 {project.inProgressCount} · 지연 {project.delayedCount} · 대기 {project.pendingCount} · 완료 {project.completedCount}
                                  </p>
                                </div>
                                <Link href={`/tasks?projectId=${project.projectId}&status=IN_PROGRESS`}>
                                  <Button size="sm" variant="outline">Tasks 보기</Button>
                                </Link>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                  <thead>
                                    <tr className="border-b border-slate-100">
                                      <th className="py-2 px-3 text-xs uppercase text-slate-500">업무명</th>
                                      <th className="py-2 px-3 text-xs uppercase text-slate-500">Phase</th>
                                      <th className="py-2 px-3 text-xs uppercase text-slate-500">상태</th>
                                      <th className="py-2 px-3 text-xs uppercase text-slate-500">우선순위</th>
                                      <th className="py-2 px-3 text-xs uppercase text-slate-500">일정</th>
                                      <th className="py-2 px-3 text-xs uppercase text-slate-500">진행률</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {project.tasks.map((task) => (
                                      <tr key={task.id} className="border-b border-slate-50">
                                        <td className="py-2 px-3">
                                          <Link
                                            href={`/tasks?projectId=${project.projectId}&q=${encodeURIComponent(task.title)}`}
                                            className="font-medium text-blue-700 hover:underline"
                                          >
                                            {task.title}
                                          </Link>
                                        </td>
                                        <td className="py-2 px-3 text-slate-700">{task.phase}</td>
                                        <td className="py-2 px-3"><StatusBadge status={task.status} /></td>
                                        <td className="py-2 px-3 text-slate-700">{priorityLabel[task.priority]}</td>
                                        <td className="py-2 px-3 text-slate-600">{formatDate(task.startDate)} ~ {formatDate(task.endDate)}</td>
                                        <td className="py-2 px-3 text-slate-700">{task.progress}%</td>
                                      </tr>
                                    ))}
                                    {project.tasks.length === 0 ? (
                                      <tr>
                                        <td colSpan={6} className="py-3 px-3 text-sm text-slate-500">진행중 항목이 없습니다.</td>
                                      </tr>
                                    ) : null}
                                  </tbody>
                                </table>
                              </div>
                            </section>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {showAdminControls ? (
        <>
          <Card data-testid="team-admin-create-panel">
            <CardHeader>
              <CardTitle className="text-base">팀원 생성 (관리자)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-5">
              <input
                placeholder="이름"
                value={createForm.name}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm"
              />
              <input
                type="email"
                placeholder="이메일"
                value={createForm.email}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm"
              />
              <input
                type="password"
                placeholder="비밀번호(8자 이상)"
                value={createForm.password}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm"
              />
              <select
                value={createForm.role}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value as Role }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white"
              >
                <option value="MEMBER">팀원</option>
                <option value="ADMIN">팀장</option>
              </select>
              <Button onClick={createUser}>생성</Button>
            </CardContent>
          </Card>

          <Card data-testid="team-admin-manage-panel">
            <CardHeader>
              <CardTitle className="text-base">팀원 관리 (관리자)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
                  className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white"
                >
                  <option value="ALL">전체</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-3 px-4 text-xs uppercase text-slate-500">이름</th>
                      <th className="py-3 px-4 text-xs uppercase text-slate-500">이메일</th>
                      <th className="py-3 px-4 text-xs uppercase text-slate-500">역할</th>
                      <th className="py-3 px-4 text-xs uppercase text-slate-500">상태</th>
                      <th className="py-3 px-4 text-xs uppercase text-slate-500">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-800">{user.name}</td>
                        <td className="py-3 px-4 text-slate-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <select
                            value={user.role}
                            onChange={(event) => updateUser(user.id, { role: event.target.value as Role })}
                            className="h-8 rounded-md border border-slate-200 px-2 text-xs bg-white"
                          >
                            <option value="MEMBER">팀원</option>
                            <option value="ADMIN">팀장</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <span className={user.isActive ? "text-emerald-600" : "text-slate-400"}>
                            {user.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {user.isActive ? (
                            <Button variant="outline" size="sm" onClick={() => deactivateUser(user.id)}>
                              비활성화
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => updateUser(user.id, { isActive: true })}>
                              활성화
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAdminUsers.length === 0 ? (
                  <p className="text-sm text-slate-500 mt-3">조건에 맞는 팀원이 없습니다.</p>
                ) : null}
                {message ? <p className="text-xs text-slate-500 mt-3">{message}</p> : null}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}
