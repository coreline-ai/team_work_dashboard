"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Bell, Search, UserCircle2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAdminMode } from "@/components/providers/admin-mode-provider"
import { getRoleLabel } from "@/lib/role-label"
import type {
  ProfileOverview,
  SearchApiResponse,
  SearchScope,
  SearchScopeOption,
  TaskStatus,
} from "@/types/domain"
import { cn } from "@/lib/utils"

interface NotificationItem {
  id: string
  title: string
  body: string
  isRead: boolean
  createdAt?: string
}

interface SearchHistoryItem {
  id: string
  query: string
  scope: SearchScope
}

interface SearchResults {
  tasks: Array<{ id: string; title: string; projectId: string; phase: string; status: TaskStatus }>
  projects: Array<{ id: string; name: string }>
  members: Array<{ id: string; name: string }>
}

const EMPTY_SEARCH_RESULTS: SearchResults = { tasks: [], projects: [], members: [] }

function getResultCount(results: SearchResults) {
  return results.tasks.length + results.projects.length + results.members.length
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR")
}

export function Header({ className }: { className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { enabled: adminModeEnabled, toggle: toggleAdminMode, setEnabled: setAdminModeEnabled } = useAdminMode()

  const searchContainerRef = React.useRef<HTMLDivElement>(null)
  const notificationContainerRef = React.useRef<HTMLDivElement>(null)
  const profileContainerRef = React.useRef<HTMLDivElement>(null)
  const searchAbortRef = React.useRef<AbortController | null>(null)
  const searchRequestIdRef = React.useRef(0)
  const isComposingRef = React.useRef(false)

  const isAuthenticated = status === "authenticated"
  const isAdmin = session?.user?.role === "ADMIN"

  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchScope, setSearchScope] = React.useState<SearchScopeOption>("ALL")
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchLoading, setSearchLoading] = React.useState(false)
  const [searchError, setSearchError] = React.useState<string | null>(null)

  const [notificationsOpen, setNotificationsOpen] = React.useState(false)
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])

  const [profileOpen, setProfileOpen] = React.useState(false)
  const [profileLoading, setProfileLoading] = React.useState(false)
  const [profileOverview, setProfileOverview] = React.useState<ProfileOverview | null>(null)

  const [searchResults, setSearchResults] = React.useState<SearchResults>(EMPTY_SEARCH_RESULTS)
  const [history, setHistory] = React.useState<SearchHistoryItem[]>([])

  const initials = React.useMemo(() => {
    const name = session?.user?.name ?? "User"
    const chunks = name.trim().split(/\s+/).slice(0, 2)
    return chunks.map((chunk) => chunk[0]?.toUpperCase() ?? "").join("") || "U"
  }, [session?.user?.name])

  const refreshNotifications = React.useCallback(async () => {
    if (!isAuthenticated) return
    const res = await fetch("/api/notifications")
    if (!res.ok) return
    const payload = await res.json()
    setNotifications(payload.notifications ?? [])
    setUnreadCount(payload.unreadCount ?? 0)
  }, [isAuthenticated])

  const refreshSearchHistory = React.useCallback(async () => {
    if (!isAuthenticated) return
    const res = await fetch("/api/search/history")
    if (!res.ok) return
    const payload = await res.json()
    setHistory(payload.items ?? [])
  }, [isAuthenticated])

  const refreshProfileOverview = React.useCallback(async () => {
    if (!isAuthenticated) return
    setProfileLoading(true)
    const res = await fetch("/api/profile/overview")
    if (!res.ok) {
      setProfileLoading(false)
      return
    }
    const payload = await res.json()
    setProfileOverview(payload)
    setProfileLoading(false)
  }, [isAuthenticated])

  React.useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      setHistory([])
      setProfileOverview(null)
      setAdminModeEnabled(false)
      return
    }
    refreshNotifications()
    refreshSearchHistory()
  }, [isAuthenticated, refreshNotifications, refreshSearchHistory, setAdminModeEnabled])

  React.useEffect(() => {
    setSearchOpen(false)
    setNotificationsOpen(false)
    setProfileOpen(false)
  }, [pathname])

  React.useEffect(() => {
    const onPointerDown = (event: Event) => {
      const target = event.target as Node | null
      if (!target) return

      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setSearchOpen(false)
      }
      if (notificationContainerRef.current && !notificationContainerRef.current.contains(target)) {
        setNotificationsOpen(false)
      }
      if (profileContainerRef.current && !profileContainerRef.current.contains(target)) {
        setProfileOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false)
        setNotificationsOpen(false)
        setProfileOpen(false)
      }
    }

    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("touchstart", onPointerDown, true)
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("touchstart", onPointerDown, true)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  React.useEffect(() => {
    if (profileOpen) {
      refreshProfileOverview()
    }
  }, [profileOpen, refreshProfileOverview])

  React.useEffect(() => {
    const query = searchQuery.trim()
    if (!query) {
      searchAbortRef.current?.abort()
      setSearchLoading(false)
      setSearchError(null)
      setSearchResults(EMPTY_SEARCH_RESULTS)
      return
    }

    if (isComposingRef.current) return

    const timer = window.setTimeout(async () => {
      searchAbortRef.current?.abort()
      const controller = new AbortController()
      searchAbortRef.current = controller
      const requestId = ++searchRequestIdRef.current

      setSearchLoading(true)
      setSearchError(null)

      const endpoint = isAuthenticated ? "/api/search" : "/api/public/search"
      const params = new URLSearchParams()
      params.set("q", query)
      if (searchScope !== "ALL") params.set("scope", searchScope)

      try {
        const res = await fetch(`${endpoint}?${params.toString()}`, { signal: controller.signal })
        if (!res.ok) throw new Error(`search failed: ${res.status}`)

        const payload = (await res.json()) as SearchApiResponse
        if (requestId !== searchRequestIdRef.current) return
        setSearchResults({
          tasks: payload.tasks ?? [],
          projects: payload.projects ?? [],
          members: payload.members ?? [],
        })
      } catch (error) {
        if (controller.signal.aborted) return
        if (requestId !== searchRequestIdRef.current) return
        setSearchResults(EMPTY_SEARCH_RESULTS)
        setSearchError(error instanceof Error ? error.message : "검색 중 오류가 발생했습니다.")
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setSearchLoading(false)
        }
      }
    }, 220)

    return () => window.clearTimeout(timer)
  }, [isAuthenticated, searchQuery, searchScope])

  const saveSearchHistory = async (query: string, scope: SearchScope) => {
    if (!isAuthenticated) return
    await fetch("/api/search/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, scope }),
    })
    refreshSearchHistory()
  }

  const moveToAdvancedSearch = () => {
    const params = new URLSearchParams()
    const q = searchQuery.trim()
    if (q) params.set("q", q)
    if (searchScope !== "ALL") params.set("scope", searchScope)
    router.push(params.toString() ? `/search?${params.toString()}` : "/search")
    setSearchOpen(false)
  }

  const onSelectTask = async (task: SearchResults["tasks"][number]) => {
    await saveSearchHistory(task.title, "TASK")
    router.push(`/tasks?projectId=${task.projectId}&q=${encodeURIComponent(task.title)}`)
    setSearchOpen(false)
  }

  const onSelectProject = async (project: SearchResults["projects"][number]) => {
    await saveSearchHistory(project.name, "PROJECT")
    router.push(`/projects/${project.id}`)
    setSearchOpen(false)
  }

  const onSelectMember = async (member: SearchResults["members"][number]) => {
    await saveSearchHistory(member.name, "MEMBER")
    router.push("/team-members")
    setSearchOpen(false)
  }

  const markNotificationRead = async (id: string) => {
    if (!isAuthenticated) return
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" })
    refreshNotifications()
  }

  const markAllRead = async () => {
    if (!isAuthenticated) return
    await fetch("/api/notifications/read-all", { method: "PATCH" })
    refreshNotifications()
  }

  return (
    <header className={cn("flex items-center justify-between px-6 bg-white border-b border-slate-200 h-16 shrink-0 z-10", className)}>
      <div className="flex items-center flex-1">
        <div
          ref={searchContainerRef}
          data-testid="header-search-container"
          className="relative w-full max-w-2xl hidden md:flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              enterKeyHint="search"
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setSearchOpen(true)
                setNotificationsOpen(false)
                setProfileOpen(false)
              }}
              onFocus={() => {
                setSearchOpen(true)
                setNotificationsOpen(false)
                setProfileOpen(false)
              }}
              onCompositionStart={() => {
                isComposingRef.current = true
              }}
              onCompositionEnd={(event) => {
                isComposingRef.current = false
                setSearchQuery(event.currentTarget.value)
                setSearchOpen(true)
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setSearchOpen(false)
                  return
                }
                if (event.key === "Enter" && !isComposingRef.current) {
                  event.preventDefault()
                  moveToAdvancedSearch()
                }
              }}
              placeholder="Search tasks, projects, members..."
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium placeholder:font-normal"
            />
          </div>
          <select
            value={searchScope}
            onChange={(event) => {
              setSearchScope(event.target.value as SearchScopeOption)
              setSearchOpen(true)
            }}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
          >
            <option value="ALL">전체</option>
            <option value="TASK">업무</option>
            <option value="PROJECT">프로젝트</option>
            <option value="MEMBER">팀원</option>
          </select>
          {searchOpen ? (
            <div
              data-testid="header-search-dropdown"
              className="absolute top-11 left-0 w-[min(100%,42rem)] rounded-md border border-slate-200 bg-white shadow-lg p-2 z-30"
            >
              {searchQuery.trim() ? (
                <div className="space-y-1">
                  {searchLoading ? <div className="px-2 py-1.5 text-sm text-slate-500">검색 중...</div> : null}
                  {!searchLoading && searchError ? (
                    <div className="px-2 py-1.5 text-sm text-red-600">{searchError}</div>
                  ) : null}
                  {!searchLoading && !searchError ? (
                    <>
                      {searchResults.tasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => onSelectTask(task)}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 text-sm"
                        >
                          업무: {task.title} <span className="text-xs text-slate-500">({task.phase})</span>
                        </button>
                      ))}
                      {searchResults.projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => onSelectProject(project)}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 text-sm"
                        >
                          프로젝트: {project.name}
                        </button>
                      ))}
                      {searchResults.members.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => onSelectMember(member)}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 text-sm"
                        >
                          팀원: {member.name}
                        </button>
                      ))}
                      {getResultCount(searchResults) === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-slate-500">검색 결과가 없습니다.</div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-1">
                  {isAuthenticated ? (
                    <>
                      <div className="px-2 text-xs text-slate-400">최근 검색</div>
                      {history.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSearchScope(item.scope)
                            setSearchQuery(item.query)
                            setSearchOpen(true)
                          }}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 text-sm"
                        >
                          [{item.scope}] {item.query}
                        </button>
                      ))}
                      {history.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-slate-500">최근 검색 기록이 없습니다.</div>
                      ) : null}
                    </>
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-slate-500">검색어를 입력하면 공개 정보를 조회할 수 있습니다.</div>
                  )}
                </div>
              )}
              <div className="mt-2 border-t border-slate-100 pt-2 flex justify-end">
                <Button data-testid="header-search-advanced" size="sm" variant="outline" onClick={moveToAdvancedSearch}>
                  고급검색
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {isAuthenticated ? (
        <div className="flex items-center gap-4">
          {isAdmin ? (
            <Button
              data-testid="admin-mode-toggle"
              size="sm"
              variant={adminModeEnabled ? "default" : "outline"}
              onClick={toggleAdminMode}
              title="관리 모드 토글"
            >
              {adminModeEnabled ? "관리 모드 ON" : "관리 모드 OFF"}
            </Button>
          ) : null}

          <div ref={notificationContainerRef} className="relative">
            <button
              className="relative text-slate-500 hover:text-slate-800 transition-colors"
              onClick={() => {
                setNotificationsOpen((prev) => !prev)
                setSearchOpen(false)
                setProfileOpen(false)
              }}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" /> : null}
            </button>
            {notificationsOpen ? (
              <div className="absolute right-0 top-8 w-96 rounded-md border border-slate-200 bg-white shadow-lg z-30 p-2">
                <div className="flex items-center justify-between px-2 pb-1">
                  <span className="text-sm font-semibold">알림</span>
                  <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">전체 읽음</button>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-1">
                  {notifications.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => markNotificationRead(item.id)}
                      className={cn(
                        "w-full text-left rounded px-2 py-2 hover:bg-slate-100",
                        item.isRead ? "opacity-70" : "bg-blue-50/50",
                      )}
                    >
                      <div className="text-sm font-medium text-slate-800">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.body}</div>
                      {item.createdAt ? <div className="mt-1 text-[10px] text-slate-400">{formatDateTime(item.createdAt)}</div> : null}
                    </button>
                  ))}
                  {notifications.length === 0 ? <div className="px-2 py-2 text-sm text-slate-500">새 알림이 없습니다.</div> : null}
                </div>
              </div>
            ) : null}
          </div>

          <div ref={profileContainerRef} className="relative">
            <button
              data-testid="header-profile-trigger"
              className="flex items-center gap-3 border-l pl-4 border-slate-200"
              onClick={() => {
                setProfileOpen((prev) => !prev)
                setSearchOpen(false)
                setNotificationsOpen(false)
              }}
            >
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-800">{session?.user?.name ?? "Unknown"}</span>
                <span className="text-xs font-medium text-slate-500">{getRoleLabel(session?.user?.role)}</span>
              </div>
              <Avatar className="h-9 w-9 border border-slate-200 shadow-sm">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>

            {profileOpen ? (
              <div
                data-testid="header-profile-popover"
                className="absolute right-0 top-12 w-[min(100vw-2rem,24rem)] rounded-md border border-slate-200 bg-white shadow-lg z-30 p-3"
              >
                <div className="flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-800">내 정보</h3>
                </div>

                {profileLoading ? <p className="mt-2 text-sm text-slate-500">불러오는 중...</p> : null}
                {!profileLoading && profileOverview ? (
                  <div className="mt-2 space-y-3">
                    <div className="rounded-md border border-slate-200 p-2 text-xs text-slate-700 space-y-1">
                      <p><span className="text-slate-500">이름:</span> {profileOverview.account.name}</p>
                      <p><span className="text-slate-500">이메일:</span> {profileOverview.account.email}</p>
                      <p><span className="text-slate-500">역할:</span> {getRoleLabel(profileOverview.account.role)}</p>
                      <p><span className="text-slate-500">상태:</span> {profileOverview.account.isActive ? "ACTIVE" : "INACTIVE"}</p>
                      <p><span className="text-slate-500">가입일:</span> {formatDateTime(profileOverview.account.createdAt)}</p>
                    </div>

                    <div className="rounded-md border border-slate-200 p-2 text-xs text-slate-700 space-y-1">
                      <p><span className="text-slate-500">언어:</span> {profileOverview.settings.locale}</p>
                      <p><span className="text-slate-500">타임존:</span> {profileOverview.settings.timezone}</p>
                      <p><span className="text-slate-500">시작 페이지:</span> {profileOverview.settings.defaultStartPage}</p>
                    </div>

                    <div className="rounded-md border border-slate-200 p-2 text-xs text-slate-700 space-y-1">
                      <p><span className="text-slate-500">미읽음 알림:</span> {profileOverview.summary.unreadNotifications}</p>
                      <p><span className="text-slate-500">최근 7일 변경:</span> {profileOverview.summary.myActivityCount7d}</p>
                      <div>
                        <p className="text-slate-500 mb-1">최근 변경 5건</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {profileOverview.summary.myRecentActions.map((item) => (
                            <div key={item.id} className="rounded bg-slate-50 px-2 py-1">
                              <p className="font-medium text-slate-700">{item.action}</p>
                              <p className="text-[11px] text-slate-500">{item.entityType}:{item.entityId} · {formatDateTime(item.createdAt)}</p>
                            </div>
                          ))}
                          {profileOverview.summary.myRecentActions.length === 0 ? (
                            <p className="text-[11px] text-slate-400">최근 변경 이력이 없습니다.</p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link href="/settings"><Button size="sm" variant="outline">Settings</Button></Link>
                      <Link href="/activity-log"><Button size="sm" variant="outline">Activity Log</Button></Link>
                      <Link href="/completed-projects"><Button size="sm" variant="outline">Completed</Button></Link>
                      <Button
                        size="sm"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                      >
                        로그아웃
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="outline" size="sm">로그인</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">회원가입</Button>
          </Link>
        </div>
      )}
    </header>
  )
}
