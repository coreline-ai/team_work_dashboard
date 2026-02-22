"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRoleLabel } from "@/lib/role-label"
import type {
  SearchApiResponse,
  SearchFilters,
  SearchMemberResult,
  SearchProjectResult,
  SearchResponseMeta,
  SearchScopeOption,
  SearchTaskResult,
  TaskStatus,
} from "@/types/domain"

interface SearchResultState {
  tasks: SearchTaskResult[]
  projects: SearchProjectResult[]
  members: SearchMemberResult[]
}

interface ProjectOption {
  id: string
  name: string
}

const EMPTY_RESULTS: SearchResultState = { tasks: [], projects: [], members: [] }
const VALID_SCOPES = new Set<SearchScopeOption>(["ALL", "TASK", "PROJECT", "MEMBER"])
const VALID_TASK_STATUSES = new Set<TaskStatus>(["PENDING", "IN_PROGRESS", "COMPLETED", "DELAYED"])

function parseScope(value: string | null): SearchScopeOption {
  if (!value) return "ALL"
  return VALID_SCOPES.has(value as SearchScopeOption) ? (value as SearchScopeOption) : "ALL"
}

function parseStatus(value: string | null): TaskStatus | undefined {
  if (!value) return undefined
  return VALID_TASK_STATUSES.has(value as TaskStatus) ? (value as TaskStatus) : undefined
}

function parseFiltersFromParams(params: URLSearchParams): SearchFilters {
  return {
    q: params.get("q") ?? "",
    scope: parseScope(params.get("scope")),
    status: parseStatus(params.get("status")),
    phase: params.get("phase") ?? "",
    projectId: params.get("projectId") ?? "",
  }
}

function buildSearchParams(filters: SearchFilters) {
  const next = new URLSearchParams()
  const q = filters.q.trim()
  if (q) next.set("q", q)
  if (filters.scope !== "ALL") next.set("scope", filters.scope)

  if (filters.scope === "TASK") {
    if (filters.status) next.set("status", filters.status)
    if ((filters.phase ?? "").trim()) next.set("phase", (filters.phase ?? "").trim())
    if ((filters.projectId ?? "").trim()) next.set("projectId", (filters.projectId ?? "").trim())
  }

  return next
}

function SearchPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { status: sessionStatus } = useSession()
  const isAuthenticated = sessionStatus === "authenticated"

  const [filters, setFilters] = React.useState<SearchFilters>({
    q: "",
    scope: "ALL",
    status: undefined,
    phase: "",
    projectId: "",
  })
  const [results, setResults] = React.useState<SearchResultState>(EMPTY_RESULTS)
  const [meta, setMeta] = React.useState<SearchResponseMeta | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [projectOptions, setProjectOptions] = React.useState<ProjectOption[]>([])

  React.useEffect(() => {
    setFilters(parseFiltersFromParams(new URLSearchParams(params.toString())))
  }, [params])

  React.useEffect(() => {
    const run = async () => {
      const res = await fetch("/api/public/projects")
      if (!res.ok) return
      const payload = await res.json()
      const projects = (payload.projects ?? []) as Array<{ id: string; name: string }>
      setProjectOptions(projects.map((project) => ({ id: project.id, name: project.name })))
    }
    run()
  }, [])

  React.useEffect(() => {
    if (sessionStatus === "loading") return

    const requestFilters = parseFiltersFromParams(new URLSearchParams(params.toString()))
    const requestParams = buildSearchParams(requestFilters)
    const q = (requestParams.get("q") ?? "").trim()

    if (!q) {
      setResults(EMPTY_RESULTS)
      setMeta(null)
      setError(null)
      setLoading(false)
      return
    }

    const run = async () => {
      setLoading(true)
      setError(null)
      const endpoint = isAuthenticated ? "/api/search" : "/api/public/search"
      const res = await fetch(`${endpoint}?${requestParams.toString()}`)
      if (!res.ok) {
        setResults(EMPTY_RESULTS)
        setMeta(null)
        setError("검색 요청에 실패했습니다.")
        setLoading(false)
        return
      }

      const payload = (await res.json()) as SearchApiResponse
      setResults({
        tasks: payload.tasks ?? [],
        projects: payload.projects ?? [],
        members: payload.members ?? [],
      })
      setMeta(payload.meta ?? null)
      setLoading(false)
    }
    run()
  }, [isAuthenticated, params, sessionStatus])

  const applyFilters = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    const next = buildSearchParams(filters)
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">고급 검색</h1>
        <p className="text-sm text-slate-500">범위와 상세 필터를 사용해 업무, 프로젝트, 팀원을 조회합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-500" />
            검색 필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-5" onSubmit={applyFilters}>
            <input
              placeholder="검색어"
              value={filters.q}
              onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm md:col-span-2"
            />
            <select
              value={filters.scope}
              onChange={(event) =>
                setFilters((prev) => {
                  const scope = event.target.value as SearchScopeOption
                  if (scope === "TASK") return { ...prev, scope }
                  return { ...prev, scope, status: undefined, phase: "", projectId: "" }
                })
              }
              className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white"
            >
              <option value="ALL">전체</option>
              <option value="TASK">업무</option>
              <option value="PROJECT">프로젝트</option>
              <option value="MEMBER">팀원</option>
            </select>
            <select
              value={filters.status ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, status: (event.target.value || undefined) as TaskStatus | undefined }))
              }
              className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white"
              disabled={filters.scope !== "TASK"}
            >
              <option value="">전체 상태</option>
              <option value="PENDING">대기</option>
              <option value="IN_PROGRESS">진행중</option>
              <option value="COMPLETED">완료</option>
              <option value="DELAYED">지연</option>
            </select>
            <input
              placeholder="Phase"
              value={filters.phase ?? ""}
              onChange={(event) => setFilters((prev) => ({ ...prev, phase: event.target.value }))}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm"
              disabled={filters.scope !== "TASK"}
            />
            <select
              value={filters.projectId ?? ""}
              onChange={(event) => setFilters((prev) => ({ ...prev, projectId: event.target.value }))}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white md:col-span-2"
              disabled={filters.scope !== "TASK"}
            >
              <option value="">전체 프로젝트</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit">검색</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFilters({
                    q: "",
                    scope: "ALL",
                    status: undefined,
                    phase: "",
                    projectId: "",
                  })
                  setMeta(null)
                  setError(null)
                  router.replace(pathname)
                }}
              >
                필터 초기화
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? <p className="text-sm text-slate-500">검색 중...</p> : null}
      {!loading && error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!loading && !error && meta ? (
        <p className="text-xs text-slate-500">
          정규화: <span className="font-medium text-slate-700">{meta.normalizedQuery || "-"}</span>
          {" · "}토큰: <span className="font-medium text-slate-700">{meta.tokens.join(", ") || "-"}</span>
          {" · "}응답시간: <span className="font-medium text-slate-700">{meta.tookMs}ms</span>
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks ({results.tasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks?q=${encodeURIComponent(task.title)}&projectId=${task.projectId}`}
                className="block rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
              >
                <p className="text-sm font-medium text-slate-800">{task.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {task.phase} · {task.status}
                </p>
              </Link>
            ))}
            {results.tasks.length === 0 ? <p className="text-sm text-slate-500">결과 없음</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projects ({results.projects.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
              >
                <p className="text-sm font-medium text-slate-800">{project.name}</p>
                <p className="text-xs text-slate-500 mt-1">{project.description ?? "설명 없음"}</p>
              </Link>
            ))}
            {results.projects.length === 0 ? <p className="text-sm text-slate-500">결과 없음</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Members ({results.members.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.members.map((member) => (
              <Link
                key={member.id}
                href="/team-members"
                className="block rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
              >
                <p className="text-sm font-medium text-slate-800">{member.name}</p>
                <p className="text-xs text-slate-500 mt-1">{getRoleLabel(member.role)}</p>
              </Link>
            ))}
            {results.members.length === 0 ? <p className="text-sm text-slate-500">결과 없음</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <React.Suspense fallback={<div className="w-full max-w-7xl mx-auto text-sm text-slate-500">검색 페이지 로딩 중...</div>}>
      <SearchPageContent />
    </React.Suspense>
  )
}
