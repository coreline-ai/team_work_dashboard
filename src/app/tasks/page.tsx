"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, CircleDashed, Clock3, KanbanSquare, LayoutList, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskPriority, TaskStatus } from "@/types/domain"

interface TaskItem {
  id: string
  title: string
  description?: string | null
  phase: string
  status: TaskStatus
  priority: TaskPriority
  startDate: string
  endDate: string
  progress: number
  parentId?: string | null
  depth: number
  projectId: string
  assigneeId?: string
  createdById?: string
  assignee: {
    id: string
    name: string
    avatarUrl?: string | null
  }
}

interface UserItem {
  id: string
  name: string
  email: string
}

interface ProjectOption {
  id: string
  name: string
}

type TaskForm = {
  title: string
  description: string
  phase: string
  status: TaskStatus
  priority: TaskPriority
  startDate: string
  endDate: string
  progress: number
  parentId: string
  assigneeId: string
}

const initialForm: TaskForm = {
  title: "",
  description: "",
  phase: "기획",
  status: "PENDING",
  priority: "MEDIUM",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  progress: 0,
  parentId: "",
  assigneeId: "",
}

const statusMeta: Record<
  TaskStatus,
  {
    label: string
    variant: "completed" | "progress" | "pending" | "delayed"
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  COMPLETED: { label: "완료", variant: "completed", icon: CheckCircle2 },
  IN_PROGRESS: { label: "진행중", variant: "progress", icon: Clock3 },
  PENDING: { label: "대기", variant: "pending", icon: CircleDashed },
  DELAYED: { label: "지연", variant: "delayed", icon: AlertTriangle },
}

const priorityLabel: Record<TaskPriority, string> = {
  HIGH: "높음",
  MEDIUM: "중간",
  LOW: "낮음",
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const meta = statusMeta[status]
  const Icon = meta.icon
  return (
    <Badge variant={meta.variant} className="gap-1">
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </Badge>
  )
}

export default function TasksPage() {
  return (
    <React.Suspense fallback={<div className="w-full max-w-7xl mx-auto text-sm text-slate-500">작업 화면을 준비 중...</div>}>
      <TasksPageContent />
    </React.Suspense>
  )
}

function TasksPageContent() {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isAuthenticated = status === "authenticated"

  const [tasks, setTasks] = React.useState<TaskItem[]>([])
  const [users, setUsers] = React.useState<UserItem[]>([])
  const [projectOptions, setProjectOptions] = React.useState<ProjectOption[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"" | TaskStatus>("")
  const [phaseFilter, setPhaseFilter] = React.useState("")
  const [projectFilter, setProjectFilter] = React.useState("")
  const [assigneeFilter, setAssigneeFilter] = React.useState<"me" | "all">("me")
  const [showExpandedGui, setShowExpandedGui] = React.useState(true)
  const [expandedTaskIds, setExpandedTaskIds] = React.useState<Record<string, boolean>>({})
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<TaskForm>(initialForm)

  React.useEffect(() => {
    const q = searchParams.get("q") ?? ""
    const phase = searchParams.get("phase") ?? ""
    const projectId = searchParams.get("projectId") ?? ""
    const statusValue = searchParams.get("status")
    const assigneeValue = searchParams.get("assignee")

    const nextStatus =
      statusValue && ["PENDING", "IN_PROGRESS", "COMPLETED", "DELAYED"].includes(statusValue)
        ? (statusValue as TaskStatus)
        : ""

    setSearch(q)
    setPhaseFilter(phase)
    setProjectFilter(projectId)
    setStatusFilter(nextStatus)
    if (assigneeValue === "all" || assigneeValue === "me") {
      setAssigneeFilter(assigneeValue)
    } else {
      setAssigneeFilter("me")
    }
  }, [searchParams])

  const loadUsers = React.useCallback(async () => {
    if (!isAuthenticated) {
      setUsers([])
      return
    }
    const res = await fetch("/api/users")
    if (!res.ok) return
    const payload = await res.json()
    setUsers(payload.users ?? [])
  }, [isAuthenticated])

  const loadProjectOptions = React.useCallback(async () => {
    const res = await fetch("/api/public/projects")
    if (!res.ok) return
    const payload = await res.json()
    const projects = (payload.projects ?? []) as Array<{ id: string; name: string }>
    setProjectOptions(projects.map((project) => ({ id: project.id, name: project.name })))
  }, [])

  const loadTasks = React.useCallback(async () => {
    if (status === "loading") return

    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set("status", statusFilter)
    if (phaseFilter.trim()) params.set("phase", phaseFilter.trim())
    if (projectFilter.trim()) params.set("projectId", projectFilter.trim())
    if (search.trim()) params.set("q", search.trim())
    if (isAuthenticated) params.set("assignee", assigneeFilter)

    const endpoint = isAuthenticated ? "/api/tasks" : "/api/public/tasks"
    const res = await fetch(`${endpoint}?${params.toString()}`)
    if (!res.ok) {
      setLoading(false)
      return
    }

    const payload = await res.json()
    setTasks(payload.tasks ?? [])
    setLoading(false)
  }, [assigneeFilter, isAuthenticated, phaseFilter, projectFilter, search, status, statusFilter])

  React.useEffect(() => {
    loadUsers()
  }, [loadUsers])

  React.useEffect(() => {
    loadProjectOptions()
  }, [loadProjectOptions])

  React.useEffect(() => {
    loadTasks()
  }, [loadTasks])

  React.useEffect(() => {
    if (!isAuthenticated) {
      setEditingTaskId(null)
      setForm(initialForm)
    }
  }, [isAuthenticated])

  const onEdit = (task: TaskItem) => {
    if (!isAuthenticated) return
    setEditingTaskId(task.id)
    setForm({
      title: task.title,
      description: task.description ?? "",
      phase: task.phase,
      status: task.status,
      priority: task.priority,
      startDate: task.startDate.slice(0, 10),
      endDate: task.endDate.slice(0, 10),
      progress: task.progress,
      parentId: task.parentId ?? "",
      assigneeId: task.assignee.id,
    })
  }

  const resetForm = () => {
    setEditingTaskId(null)
    setForm({
      ...initialForm,
      assigneeId: users[0]?.id ?? "",
    })
  }

  React.useEffect(() => {
    if (!form.assigneeId && users.length > 0) {
      setForm((prev) => ({ ...prev, assigneeId: users[0].id }))
    }
  }, [form.assigneeId, users])

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isAuthenticated) return

    setSaving(true)
    setMessage("")

    const payload = {
      ...form,
      parentId: form.parentId || null,
      projectId: projectFilter || undefined,
    }

    const res = await fetch(editingTaskId ? `/api/tasks/${editingTaskId}` : "/api/tasks", {
      method: editingTaskId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setMessage(body?.message ?? "저장에 실패했습니다.")
      return
    }

    setMessage(editingTaskId ? "업무가 수정되었습니다." : "업무가 생성되었습니다.")
    resetForm()
    loadTasks()
  }

  const onDelete = async (id: string) => {
    if (!isAuthenticated) return
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setMessage(body?.message ?? "삭제에 실패했습니다.")
      return
    }
    setMessage("업무가 삭제되었습니다.")
    loadTasks()
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search.trim()) params.set("q", search.trim())
    if (statusFilter) params.set("status", statusFilter)
    if (phaseFilter.trim()) params.set("phase", phaseFilter.trim())
    if (projectFilter.trim()) params.set("projectId", projectFilter.trim())
    if (isAuthenticated && assigneeFilter) params.set("assignee", assigneeFilter)

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
    loadTasks()
  }

  const summary = React.useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter((task) => task.status === "PENDING").length,
      inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
      completed: tasks.filter((task) => task.status === "COMPLETED").length,
      delayed: tasks.filter((task) => task.status === "DELAYED").length,
    }
  }, [tasks])

  const taskBoardColumns: Array<{ key: TaskStatus; label: string }> = [
    { key: "PENDING", label: "대기" },
    { key: "IN_PROGRESS", label: "진행중" },
    { key: "COMPLETED", label: "완료" },
    { key: "DELAYED", label: "지연" },
  ]

  const taskChildrenMap = React.useMemo(() => {
    const map = new Map<string, TaskItem[]>()
    for (const task of tasks) {
      if (!task.parentId) continue
      const arr = map.get(task.parentId) ?? []
      arr.push(task)
      map.set(task.parentId, arr)
    }
    return map
  }, [tasks])

  const visibleTaskRows = React.useMemo(() => {
    const idSet = new Set(tasks.map((task) => task.id))
    const roots = tasks.filter((task) => !task.parentId || !idSet.has(task.parentId))
    const result: TaskItem[] = []

    const appendChildren = (parentId: string) => {
      const children = taskChildrenMap.get(parentId) ?? []
      for (const child of children) {
        result.push(child)
        if (expandedTaskIds[child.id]) {
          appendChildren(child.id)
        }
      }
    }

    for (const root of roots) {
      result.push(root)
      if (expandedTaskIds[root.id]) {
        appendChildren(root.id)
      }
    }

    return result
  }, [expandedTaskIds, taskChildrenMap, tasks])

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTaskIds((prev) => ({ ...prev, [taskId]: !prev[taskId] }))
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">작업 관리</h1>
        <p className="text-sm text-slate-500">
          {isAuthenticated ? "개인/팀 태스크 생성, 수정, 삭제" : "공개 진행 현황 조회 (읽기 전용)"}
        </p>
      </div>

      {isAuthenticated ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingTaskId ? "업무 수정" : "업무 생성"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-3" onSubmit={onSubmit}>
              <input
                placeholder="업무명"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm"
                required
              />
              <input
                placeholder="Phase"
                value={form.phase}
                onChange={(event) => setForm((prev) => ({ ...prev, phase: event.target.value }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm"
                required
              />
              <select
                value={form.assigneeId}
                onChange={(event) => setForm((prev) => ({ ...prev, assigneeId: event.target.value }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              <textarea
                placeholder="설명"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className="md:col-span-3 min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <select
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as TaskStatus }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white"
              >
                <option value="PENDING">대기</option>
                <option value="IN_PROGRESS">진행중</option>
                <option value="COMPLETED">완료</option>
                <option value="DELAYED">지연</option>
              </select>
              <select
                value={form.priority}
                onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white"
              >
                <option value="HIGH">높음</option>
                <option value="MEDIUM">중간</option>
                <option value="LOW">낮음</option>
              </select>
              <input
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={(event) => setForm((prev) => ({ ...prev, progress: Number(event.target.value) }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm"
              />
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm"
              />
              <input
                type="date"
                value={form.endDate}
                onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm"
              />
              <select
                value={form.parentId}
                onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white"
              >
                <option value="">상위 업무 없음</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>

              <div className="md:col-span-3 flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? "저장 중..." : editingTaskId ? "수정 저장" : "업무 생성"}</Button>
                {editingTaskId ? <Button type="button" variant="outline" onClick={resetForm}>취소</Button> : null}
                <span className="text-xs text-slate-500 self-center">{message}</span>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <LayoutList className="h-4 w-4 text-slate-500" />
              업무 목록
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowExpandedGui((prev) => !prev)}
              className="gap-1.5"
            >
              <KanbanSquare className="h-4 w-4" />
              {showExpandedGui ? "확장 GUI 숨기기" : "확장 GUI 보기"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5 mb-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-500">전체</p>
              <p className="text-xl font-semibold text-slate-900">{summary.total}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs text-amber-700">대기</p>
              <p className="text-xl font-semibold text-amber-800">{summary.pending}</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
              <p className="text-xs text-blue-700">진행중</p>
              <p className="text-xl font-semibold text-blue-800">{summary.inProgress}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs text-emerald-700">완료</p>
              <p className="text-xl font-semibold text-emerald-800">{summary.completed}</p>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
              <p className="text-xs text-rose-700">지연</p>
              <p className="text-xl font-semibold text-rose-800">{summary.delayed}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white min-w-52"
            >
              <option value="">전체 프로젝트</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            <input
              placeholder="검색어"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm"
            />
            <input
              placeholder="Phase"
              value={phaseFilter}
              onChange={(event) => setPhaseFilter(event.target.value)}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "" | TaskStatus)}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white"
            >
              <option value="">전체 상태</option>
              <option value="PENDING">대기</option>
              <option value="IN_PROGRESS">진행중</option>
              <option value="COMPLETED">완료</option>
              <option value="DELAYED">지연</option>
            </select>
            {isAuthenticated ? (
              <select
                value={assigneeFilter}
                onChange={(event) => setAssigneeFilter(event.target.value as "me" | "all")}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white"
              >
                <option value="me">내 업무</option>
                <option value="all">전체 업무</option>
              </select>
            ) : null}
            <Button onClick={applyFilters}>조회</Button>
          </div>

          {loading ? (
            <div className="text-sm text-slate-500">업무를 불러오는 중...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 px-4 text-xs uppercase text-slate-500">업무명</th>
                    <th className="py-3 px-4 text-xs uppercase text-slate-500">Phase</th>
                    <th className="py-3 px-4 text-xs uppercase text-slate-500">담당자</th>
                    <th className="py-3 px-4 text-xs uppercase text-slate-500">상태</th>
                    <th className="py-3 px-4 text-xs uppercase text-slate-500">우선순위</th>
                    <th className="py-3 px-4 text-xs uppercase text-slate-500">일정</th>
                    <th className="py-3 px-4 text-xs uppercase text-slate-500">진행률</th>
                    {isAuthenticated ? <th className="py-3 px-4 text-xs uppercase text-slate-500">액션</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {visibleTaskRows.map((task) => {
                    const childCount = (taskChildrenMap.get(task.id) ?? []).length
                    const hasChildren = childCount > 0
                    const isExpanded = Boolean(expandedTaskIds[task.id])

                    return (
                      <tr key={task.id} className="border-b border-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-800" style={{ paddingLeft: `${task.depth * 20 + 16}px` }}>
                          <div className="flex items-center gap-1.5">
                            {hasChildren ? (
                              <button
                                type="button"
                                aria-label={isExpanded ? "하위 업무 접기" : "하위 업무 펼치기"}
                                onClick={() => toggleTaskExpanded(task.id)}
                                className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-100"
                              >
                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              </button>
                            ) : (
                              <span className="inline-block h-5 w-5" />
                            )}
                            <span>{task.title}</span>
                            {hasChildren ? <span className="text-xs text-slate-400">({childCount})</span> : null}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{task.phase}</td>
                        <td className="py-3 px-4 text-slate-700">{task.assignee.name}</td>
                        <td className="py-3 px-4 text-slate-600">
                          <StatusBadge status={task.status} />
                        </td>
                        <td className="py-3 px-4 text-slate-600">{priorityLabel[task.priority]}</td>
                        <td className="py-3 px-4 text-slate-600">{task.startDate.slice(0, 10)} ~ {task.endDate.slice(0, 10)}</td>
                        <td className="py-3 px-4">
                          <div className="flex min-w-28 items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-blue-600 transition-all"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="text-slate-600">{task.progress}%</span>
                          </div>
                        </td>
                        {isAuthenticated ? (
                          <td className="py-3 px-4 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => onEdit(task)} className="gap-1">
                              <Pencil className="h-3.5 w-3.5" />
                              수정
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => onDelete(task.id)} className="gap-1">
                              <Trash2 className="h-3.5 w-3.5" />
                              삭제
                            </Button>
                          </td>
                        ) : null}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {visibleTaskRows.length === 0 ? <div className="text-sm text-slate-500 py-4">조회된 업무가 없습니다.</div> : null}
            </div>
          )}
        </CardContent>
      </Card>

      {showExpandedGui ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KanbanSquare className="h-4 w-4 text-slate-500" />
              확장 GUI 보드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 xl:grid-cols-4">
              {taskBoardColumns.map((column) => {
                const columnTasks = tasks.filter((task) => task.status === column.key)
                return (
                  <div key={column.key} className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <StatusBadge status={column.key} />
                      <span className="text-xs text-slate-500">{columnTasks.length}건</span>
                    </div>
                    <div className="space-y-2">
                      {columnTasks.map((task) => (
                        <div key={`board-${task.id}`} className="rounded-md border border-slate-200 bg-white p-3">
                          <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{task.phase} · {task.assignee.name}</p>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${task.progress}%` }} />
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                            <span>{priorityLabel[task.priority]}</span>
                            <span>{task.endDate.slice(5, 10)}</span>
                          </div>
                          {isAuthenticated ? (
                            <div className="mt-3 flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => onEdit(task)} className="gap-1">
                                <Pencil className="h-3.5 w-3.5" />
                                수정
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => onDelete(task.id)} className="gap-1">
                                <Trash2 className="h-3.5 w-3.5" />
                                삭제
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                      {columnTasks.length === 0 ? (
                        <p className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-400">
                          항목 없음
                        </p>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
