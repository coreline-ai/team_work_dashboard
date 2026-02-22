"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  GaugeCircle,
  PieChart as PieChartIcon,
  TrendingUp,
  UserRound,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRoleLabel } from "@/lib/role-label"
import type {
  ProjectDashboardOverview,
  ProjectHealth,
  ProjectMemberTaskDetail,
  ProjectScheduleLane,
  TaskPriority,
  TaskStatus,
} from "@/types/domain"

type ProjectDashboardPageSource = "dashboard" | "projects"

type ScheduleTab = "phase" | "member"
type ScheduleScale = "week" | "month"
type ScheduleZoom = "7d" | "30d" | "all" | "custom"
type CustomZoomRange = { startMs: number; endMs: number } | null

const healthMeta: Record<ProjectHealth, { label: string; className: string }> = {
  ON_TRACK: { label: "정상", className: "bg-emerald-100 text-emerald-700 border-transparent" },
  AT_RISK: { label: "주의", className: "bg-amber-100 text-amber-700 border-transparent" },
  CRITICAL: { label: "위험", className: "bg-rose-100 text-rose-700 border-transparent" },
}

const statusMeta: Record<
  TaskStatus,
  { label: string; className: "completed" | "progress" | "pending" | "delayed" }
> = {
  COMPLETED: { label: "완료", className: "completed" },
  IN_PROGRESS: { label: "진행중", className: "progress" },
  PENDING: { label: "대기", className: "pending" },
  DELAYED: { label: "지연", className: "delayed" },
}

const priorityLabel: Record<TaskPriority, string> = {
  HIGH: "높음",
  MEDIUM: "중간",
  LOW: "낮음",
}

function HealthBadge({ health }: { health: ProjectHealth }) {
  const meta = healthMeta[health]
  return <Badge className={meta.className}>{meta.label}</Badge>
}

function formatDate(dateString: string) {
  return dateString.slice(0, 10)
}

function getZoomLabel(zoom: ScheduleZoom) {
  if (zoom === "all") return "전체"
  if (zoom === "7d") return "7일"
  if (zoom === "30d") return "30일"
  return "사용자 지정"
}

function formatScaleTickLabel(date: Date, scale: ScheduleScale) {
  if (scale === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  }
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`
}

function clampPercent(value: number) {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

function getTaskLink(projectId: string, query: string) {
  return `/tasks?projectId=${projectId}&q=${encodeURIComponent(query)}`
}

function MemberTaskRows({
  projectId,
  tasks,
}: {
  projectId: string
  tasks: ProjectMemberTaskDetail[]
}) {
  return (
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
          {tasks.map((task) => (
            <tr key={task.id} className="border-b border-slate-50">
              <td className="py-2 px-3" style={{ paddingLeft: `${task.depth * 18 + 12}px` }}>
                <Link href={getTaskLink(projectId, task.title)} className="font-medium text-blue-700 hover:underline">
                  {task.title}
                </Link>
              </td>
              <td className="py-2 px-3 text-slate-700">{task.phase}</td>
              <td className="py-2 px-3">
                <Badge variant={statusMeta[task.status].className}>{statusMeta[task.status].label}</Badge>
              </td>
              <td className="py-2 px-3 text-slate-700">{priorityLabel[task.priority]}</td>
              <td className="py-2 px-3 text-slate-600">
                {formatDate(task.startDate)} ~ {formatDate(task.endDate)}
              </td>
              <td className="py-2 px-3 text-slate-700">{task.progress}%</td>
            </tr>
          ))}
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-3 px-3 text-sm text-slate-500">할당된 업무가 없습니다.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

function GanttChart({
  lanes,
  scheduleStart,
  scheduleEnd,
  today,
  forecast,
  scale,
  zoom,
  customRange,
  onCustomRangeChange,
}: {
  lanes: ProjectScheduleLane[]
  scheduleStart: string
  scheduleEnd: string
  today: string
  forecast: string
  scale: ScheduleScale
  zoom: ScheduleZoom
  customRange: CustomZoomRange
  onCustomRangeChange: (range: { startMs: number; endMs: number } | null) => void
}) {
  const dayMs = 24 * 60 * 60 * 1000
  const projectStartMs = new Date(scheduleStart).getTime()
  const projectEndMs = new Date(scheduleEnd).getTime()
  const todayMs = new Date(today).getTime()
  const selectionRef = React.useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const [dragStartPct, setDragStartPct] = React.useState<number | null>(null)
  const [dragCurrentPct, setDragCurrentPct] = React.useState<number | null>(null)

  const getZoomRange = () => {
    if (zoom === "custom" && customRange) {
      const boundedStart = Math.max(projectStartMs, Math.min(projectEndMs, customRange.startMs))
      const boundedEnd = Math.max(projectStartMs, Math.min(projectEndMs, customRange.endMs))
      const start = Math.min(boundedStart, boundedEnd)
      const end = Math.max(start + dayMs, Math.max(boundedStart, boundedEnd))
      return { start, end: Math.min(projectEndMs, end) }
    }

    if (zoom === "all") {
      return { start: projectStartMs, end: projectEndMs }
    }

    const halfWindowDays = zoom === "7d" ? 3 : 15
    const windowStart = todayMs - halfWindowDays * dayMs
    const windowEnd = todayMs + halfWindowDays * dayMs

    if (windowEnd < projectStartMs) {
      return { start: projectStartMs, end: Math.min(projectEndMs, projectStartMs + (halfWindowDays * 2 + 1) * dayMs) }
    }
    if (windowStart > projectEndMs) {
      return { start: Math.max(projectStartMs, projectEndMs - (halfWindowDays * 2 + 1) * dayMs), end: projectEndMs }
    }
    return {
      start: Math.max(projectStartMs, windowStart),
      end: Math.min(projectEndMs, windowEnd),
    }
  }

  const zoomRange = getZoomRange()
  const startMs = zoomRange.start
  const endMs = Math.max(zoomRange.end, zoomRange.start + dayMs)
  const duration = Math.max(dayMs, endMs - startMs)

  const tickDates: Date[] = []
  const tickCursor = new Date(startMs)
  if (scale === "month") {
    tickCursor.setDate(1)
  }
  while (tickCursor.getTime() <= endMs) {
    if (tickCursor.getTime() >= startMs) {
      tickDates.push(new Date(tickCursor))
    }
    if (scale === "month") {
      tickCursor.setMonth(tickCursor.getMonth() + 1)
      tickCursor.setDate(1)
    } else {
      tickCursor.setDate(tickCursor.getDate() + 7)
    }
  }
  if (tickDates.length === 0) {
    tickDates.push(new Date(startMs))
  }

  const toPercent = (dateString: string) => {
    const value = ((new Date(dateString).getTime() - startMs) / duration) * 100
    return clampPercent(value)
  }

  const toPercentFromMs = (ms: number) => {
    const value = ((ms - startMs) / duration) * 100
    return clampPercent(value)
  }

  const percentFromClientX = React.useCallback((clientX: number) => {
    const rect = selectionRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0) return 0
    return clampPercent(((clientX - rect.left) / rect.width) * 100)
  }, [])

  React.useEffect(() => {
    if (!dragging) return

    const handleMove = (event: MouseEvent) => {
      setDragCurrentPct(percentFromClientX(event.clientX))
    }

    const handleUp = (event: MouseEvent) => {
      const endPct = percentFromClientX(event.clientX)
      const startPct = dragStartPct ?? endPct
      const leftPct = Math.min(startPct, endPct)
      const rightPct = Math.max(startPct, endPct)
      const leftMs = startMs + (leftPct / 100) * duration
      const rightMs = startMs + (rightPct / 100) * duration
      onCustomRangeChange({
        startMs: Math.round(leftMs),
        endMs: Math.round(rightMs),
      })
      setDragging(false)
      setDragStartPct(null)
      setDragCurrentPct(null)
    }

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [dragStartPct, dragging, duration, onCustomRangeChange, percentFromClientX, startMs])

  const persistedSelection = customRange
    ? {
        left: toPercentFromMs(Math.min(customRange.startMs, customRange.endMs)),
        right: toPercentFromMs(Math.max(customRange.startMs, customRange.endMs)),
      }
    : null
  const dragSelection =
    dragStartPct !== null && dragCurrentPct !== null
      ? {
          left: Math.min(dragStartPct, dragCurrentPct),
          right: Math.max(dragStartPct, dragCurrentPct),
        }
      : null

  const todayPercent = toPercent(today)
  const forecastPercent = toPercent(forecast)

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-500">
        일정 범위: {formatDate(new Date(startMs).toISOString())} ~ {formatDate(new Date(endMs).toISOString())} · 예상 완료: {formatDate(forecast)}
        <span className="ml-2">
          · 스케일: {scale === "week" ? "주간" : "월간"} · 줌: {getZoomLabel(zoom)}
        </span>
      </div>
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-2">
        <p className="mb-2 text-xs text-slate-500">드래그로 사용자 지정 기간을 선택할 수 있습니다.</p>
        <div
          ref={selectionRef}
          data-testid="gantt-selection-ruler"
          className="relative h-8 cursor-col-resize rounded bg-white"
          onMouseDown={(event) => {
            const startPct = percentFromClientX(event.clientX)
            setDragStartPct(startPct)
            setDragCurrentPct(startPct)
            setDragging(true)
          }}
        >
          {persistedSelection ? (
            <div
              className="absolute inset-y-0 rounded bg-blue-100"
              style={{
                left: `${persistedSelection.left}%`,
                width: `${Math.max(1, persistedSelection.right - persistedSelection.left)}%`,
              }}
            />
          ) : null}
          {dragSelection ? (
            <div
              className="absolute inset-y-0 rounded bg-blue-300/70"
              style={{
                left: `${dragSelection.left}%`,
                width: `${Math.max(1, dragSelection.right - dragSelection.left)}%`,
              }}
            />
          ) : null}
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
        </div>
      </div>
      <div className="rounded-lg border border-slate-200">
        <div className="grid grid-cols-[220px,1fr] border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <div className="px-3 py-2">구분</div>
          <div className="px-3 py-2">스케줄</div>
        </div>
        <div className="grid grid-cols-[220px,1fr] border-b border-slate-100 bg-white">
          <div className="px-3 py-2 text-xs text-slate-400">축</div>
          <div className="relative px-4 py-2">
            <div className="relative h-5">
              {tickDates.map((tickDate, index) => {
                const left = toPercent(tickDate.toISOString())
                const isFirst = index === 0
                const isLast = index === tickDates.length - 1
                return (
                  <div key={`tick-${tickDate.toISOString()}`} className="absolute top-0 h-full" style={{ left: `${left}%` }}>
                    <div className="h-2 border-l border-slate-300" />
                    <span
                      className={
                        isFirst
                          ? "mt-1 block whitespace-nowrap text-[10px] text-slate-500"
                          : isLast
                            ? "mt-1 block -translate-x-full whitespace-nowrap text-[10px] text-slate-500"
                            : "mt-1 block -translate-x-1/2 whitespace-nowrap text-[10px] text-slate-500"
                      }
                    >
                      {formatScaleTickLabel(tickDate, scale)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {lanes.map((lane) => {
          const laneStart = toPercent(lane.startDate)
          const laneEnd = toPercent(lane.endDate)
          const width = Math.max(2, laneEnd - laneStart)
          const delayedStyle = lane.delayedTasks > 0

          return (
            <div key={lane.id} className="grid grid-cols-[220px,1fr] border-b border-slate-100 last:border-b-0">
              <div className="px-3 py-2 text-sm text-slate-700">
                <div className="font-medium">{lane.label}</div>
                <div className="text-xs text-slate-500">{lane.totalTasks}건 · 완료 {lane.completedTasks}</div>
              </div>
              <div className="relative px-4 py-3">
                <div className="relative h-6 rounded bg-slate-100">
                  <div
                    className={`absolute top-1/2 h-4 -translate-y-1/2 rounded ${delayedStyle ? "bg-rose-500" : "bg-blue-600"}`}
                    style={{ left: `${laneStart}%`, width: `${width}%` }}
                  />
                  <span
                    className="absolute top-1/2 -translate-y-1/2 text-[11px] font-medium text-white"
                    style={{ left: `calc(${laneStart}% + 8px)` }}
                  >
                    {lane.progress}%
                  </span>

                  <div
                    className="absolute top-0 h-6 border-l border-dashed border-slate-600"
                    style={{ left: `${todayPercent}%` }}
                    title="Today"
                  />
                  <div
                    className="absolute top-0 h-6 border-l border-amber-500"
                    style={{ left: `${forecastPercent}%` }}
                    title="Forecast Completion"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{formatDate(lane.startDate)}</span>
                  <span>{formatDate(lane.endDate)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-4 rounded bg-blue-600" /> 정상 lane
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-4 rounded bg-rose-500" /> 지연 포함 lane
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 border-l border-dashed border-slate-600" /> Today
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 border-l border-amber-500" /> Forecast Completion
        </span>
      </div>
    </div>
  )
}

export function ProjectDashboardPage({
  projectId,
  source = "dashboard",
}: {
  projectId: string
  source?: ProjectDashboardPageSource
}) {
  const [overview, setOverview] = React.useState<ProjectDashboardOverview | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [scheduleTab, setScheduleTab] = React.useState<ScheduleTab>("phase")
  const [scheduleScale, setScheduleScale] = React.useState<ScheduleScale>("week")
  const [scheduleZoom, setScheduleZoom] = React.useState<ScheduleZoom>("all")
  const [customZoomRange, setCustomZoomRange] = React.useState<CustomZoomRange>(null)
  const [expandedMembers, setExpandedMembers] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    if (!projectId) return

    const run = async () => {
      setLoading(true)
      const endpoint = source === "projects"
        ? `/api/public/projects/${projectId}/overview`
        : `/api/public/dashboard/projects/${projectId}/overview`

      const res = await fetch(endpoint)
      if (!res.ok) {
        setOverview(null)
        setLoading(false)
        return
      }
      setOverview(await res.json())
      setLoading(false)
    }
    run()
  }, [projectId, source])

  if (loading) {
    return <div className="w-full max-w-7xl mx-auto text-sm text-slate-500">프로젝트 대시보드를 불러오는 중...</div>
  }
  if (!overview) {
    return <div className="w-full max-w-7xl mx-auto text-sm text-slate-500">프로젝트를 찾을 수 없습니다.</div>
  }

  const phaseChartData = overview.phaseSummary.map((phase) => ({
    phase: phase.phase,
    전체: phase.total,
    완료: phase.completed,
    지연: phase.delayed,
  }))

  const statusDistribution = [
    { name: "완료", value: overview.kpi.completedTasks, color: "#10b981" },
    { name: "진행중", value: overview.kpi.inProgressTasks, color: "#3b82f6" },
    { name: "대기", value: overview.kpi.pendingTasks, color: "#f59e0b" },
    { name: "지연", value: overview.kpi.delayedTasks, color: "#ef4444" },
  ]

  const lanes = scheduleTab === "phase" ? overview.schedule.phaseLanes : overview.schedule.memberLanes

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardContent className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-800 p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-200">Project Dashboard</p>
              <h1 className="text-2xl font-bold tracking-tight">{overview.project.name}</h1>
              <p className="text-sm text-blue-100">{overview.project.description ?? "프로젝트 상세 진행 현황"}</p>
            </div>
            <div className="flex gap-2">
              <Link href={source === "projects" ? "/projects" : "/dashboard/portfolio"}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-slate-900 border-white/80 bg-white/95 hover:bg-white"
                >
                  {source === "projects" ? "목록" : "포트폴리오"}
                </Button>
              </Link>
              <Link href={`/tasks?projectId=${projectId}`}>
                <Button size="sm">Tasks</Button>
              </Link>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <HealthBadge health={overview.health} />
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-blue-100">
              <GaugeCircle className="h-3.5 w-3.5" /> 진행률 {overview.kpi.overallProgress}%
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-blue-100">
              <AlertTriangle className="h-3.5 w-3.5" /> 리스크 {(overview.risks.delayed.length + overview.risks.dueSoon.length)}건
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MiniStat label="전체" value={overview.kpi.totalTasks} />
        <MiniStat label="완료" value={overview.kpi.completedTasks} valueClassName="text-emerald-600" />
        <MiniStat label="진행중" value={overview.kpi.inProgressTasks} valueClassName="text-blue-600" />
        <MiniStat label="지연" value={overview.kpi.delayedTasks} valueClassName="text-rose-600" />
        <MiniStat label="진행률" value={`${overview.kpi.overallProgress}%`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-7">
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-500" />
              Phase 진행 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={phaseChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="phase" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="전체" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
                <Bar dataKey="완료" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="지연" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-slate-500" />
              상태 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={96} paddingAngle={4}>
                  {statusDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="project-schedule-gantt">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-slate-500" />
              프로젝트 전체 스케줄
            </CardTitle>
            <div className="flex flex-wrap gap-1">
              <Button
                data-testid="schedule-tab-phase"
                size="sm"
                variant={scheduleTab === "phase" ? "default" : "outline"}
                onClick={() => setScheduleTab("phase")}
              >
                Phase
              </Button>
              <Button
                data-testid="schedule-tab-member"
                size="sm"
                variant={scheduleTab === "member" ? "default" : "outline"}
                onClick={() => setScheduleTab("member")}
              >
                팀 멤버
              </Button>
              <Button
                data-testid="schedule-scale-week"
                size="sm"
                variant={scheduleScale === "week" ? "default" : "outline"}
                onClick={() => setScheduleScale("week")}
              >
                주간
              </Button>
              <Button
                data-testid="schedule-scale-month"
                size="sm"
                variant={scheduleScale === "month" ? "default" : "outline"}
                onClick={() => setScheduleScale("month")}
              >
                월간
              </Button>
              <Button
                data-testid="schedule-zoom-7d"
                size="sm"
                variant={scheduleZoom === "7d" ? "default" : "outline"}
                onClick={() => {
                  setScheduleZoom("7d")
                  setCustomZoomRange(null)
                }}
              >
                7일
              </Button>
              <Button
                data-testid="schedule-zoom-30d"
                size="sm"
                variant={scheduleZoom === "30d" ? "default" : "outline"}
                onClick={() => {
                  setScheduleZoom("30d")
                  setCustomZoomRange(null)
                }}
              >
                30일
              </Button>
              <Button
                data-testid="schedule-zoom-all"
                size="sm"
                variant={scheduleZoom === "all" ? "default" : "outline"}
                onClick={() => {
                  setScheduleZoom("all")
                  setCustomZoomRange(null)
                }}
              >
                전체
              </Button>
              <Button
                data-testid="schedule-zoom-custom"
                size="sm"
                variant={scheduleZoom === "custom" ? "default" : "outline"}
                disabled={!customZoomRange}
                onClick={() => setScheduleZoom("custom")}
              >
                커스텀
              </Button>
              {customZoomRange ? (
                <Button
                  data-testid="schedule-zoom-reset-custom"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCustomZoomRange(null)
                    setScheduleZoom("all")
                  }}
                >
                  커스텀 해제
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <GanttChart
            lanes={lanes}
            scheduleStart={overview.schedule.projectStartDate}
            scheduleEnd={overview.schedule.projectEndDate}
            today={overview.schedule.today}
            forecast={overview.schedule.forecastCompletionDate}
            scale={scheduleScale}
            zoom={scheduleZoom}
            customRange={customZoomRange}
            onCustomRangeChange={(range) => {
              setCustomZoomRange(range)
              if (range) {
                setScheduleZoom("custom")
              } else {
                setScheduleZoom("all")
              }
            }}
          />
        </CardContent>
      </Card>

      <Card data-testid="project-member-workloads">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserRound className="h-4 w-4 text-slate-500" />
            팀 멤버별 업무 상세
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="py-2 px-3 text-xs uppercase text-slate-500">멤버</th>
                  <th className="py-2 px-3 text-xs uppercase text-slate-500">역할</th>
                  <th className="py-2 px-3 text-xs uppercase text-slate-500">전체</th>
                  <th className="py-2 px-3 text-xs uppercase text-slate-500">진행중</th>
                  <th className="py-2 px-3 text-xs uppercase text-slate-500">지연</th>
                  <th className="py-2 px-3 text-xs uppercase text-slate-500">완료율</th>
                  <th className="py-2 px-3 text-xs uppercase text-slate-500">상세</th>
                </tr>
              </thead>
              <tbody>
                {overview.memberWorkloads.map((member) => {
                  const expanded = Boolean(expandedMembers[member.memberId])
                  return (
                    <React.Fragment key={member.memberId}>
                      <tr className="border-b border-slate-100 hover:bg-slate-50/70">
                        <td className="py-2 px-3">
                          <Link href={getTaskLink(projectId, member.memberName)} className="font-medium text-blue-700 hover:underline">
                            {member.memberName}
                          </Link>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{getRoleLabel(member.role)}</td>
                        <td className="py-2 px-3 text-slate-700">{member.totalTasks}</td>
                        <td className="py-2 px-3 text-blue-600">{member.inProgressTasks}</td>
                        <td className="py-2 px-3 text-rose-600">{member.delayedTasks}</td>
                        <td className="py-2 px-3 text-slate-700">{member.completionRate}%</td>
                        <td className="py-2 px-3">
                          <Button
                            data-testid={`member-expand-${member.memberId}`}
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
                        </td>
                      </tr>
                      {expanded ? (
                        <tr className="border-b border-slate-100 bg-slate-50/40">
                          <td colSpan={7} className="px-2 py-2">
                            <MemberTaskRows projectId={projectId} tasks={member.tasks} />
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  )
                })}
                {overview.memberWorkloads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-3 px-3 text-sm text-slate-500">표시할 멤버 데이터가 없습니다.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-slate-500" />
            리스크 Top
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">지연</h3>
              {overview.risks.delayed.map((risk) => (
                <Link
                  key={risk.id}
                  href={getTaskLink(projectId, risk.title)}
                  className="block rounded border border-slate-200 px-3 py-2 hover:bg-slate-50"
                >
                  <p className="text-sm font-medium text-slate-800">{risk.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{risk.assigneeName} · {priorityLabel[risk.priority]} · {formatDate(risk.endDate)}</p>
                </Link>
              ))}
              {overview.risks.delayed.length === 0 ? <p className="text-xs text-slate-500">항목 없음</p> : null}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">마감 임박</h3>
              {overview.risks.dueSoon.map((risk) => (
                <Link
                  key={risk.id}
                  href={getTaskLink(projectId, risk.title)}
                  className="block rounded border border-slate-200 px-3 py-2 hover:bg-slate-50"
                >
                  <p className="text-sm font-medium text-slate-800">{risk.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{risk.assigneeName} · {priorityLabel[risk.priority]} · {formatDate(risk.endDate)}</p>
                </Link>
              ))}
              {overview.risks.dueSoon.length === 0 ? <p className="text-xs text-slate-500">항목 없음</p> : null}
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MiniStat({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string | number
  valueClassName?: string
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-semibold ${valueClassName ?? "text-slate-900"}`}>{value}</p>
    </div>
  )
}
