export type Role = "ADMIN" | "MEMBER"
export type TaskStatus = "COMPLETED" | "IN_PROGRESS" | "PENDING" | "DELAYED"
export type TaskPriority = "HIGH" | "MEDIUM" | "LOW"
export type NotificationType = "ASSIGNED" | "STATUS_CHANGED" | "DUE_SOON"
export type SearchScope = "TASK" | "PROJECT" | "MEMBER"
export type SearchScopeOption = "ALL" | SearchScope
export type ProjectHealth = "ON_TRACK" | "AT_RISK" | "CRITICAL"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  isActive: boolean
}

export interface DashboardKpi {
  totalTasks: number
  inProgressTasks: number
  completedTasks: number
  delayedTasks: number
  pendingTasks: number
  overallProgress: number
}

export interface WeeklyMetric {
  name: string
  planned: number
  completed: number
  resource: number
}

export interface StatusDistributionItem {
  name: string
  value: number
  color: string
}

export interface TaskSummary {
  id: string
  title: string
  phase: string
  assignee: {
    id: string
    name: string
    avatar?: string
  }
  status: TaskStatus
  priority: TaskPriority
  startDate: string
  endDate: string
  progress: number
  parentId?: string | null
  depth: number
}

export interface PublicDashboardKpi {
  totalTasks: number
  inProgressTasks: number
  completedTasks: number
  delayedTasks: number
  pendingTasks: number
  overallProgress: number
}

export interface PublicWeeklyMetric {
  name: string
  planned: number
  completed: number
  resource: number
  weekStart?: string
}

export interface PublicStatusDistributionItem {
  name: string
  value: number
  color: string
}

export interface PublicTaskSummary {
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
  assignee: {
    id: string
    name: string
    avatarUrl?: string | null
  }
}

export interface PublicProjectSummary {
  id: string
  name: string
  description?: string | null
  totalTasks: number
  inProgressTasks: number
  completedTasks: number
  delayedTasks: number
  pendingTasks: number
  overallProgress: number
  health: ProjectHealth
}

export interface ProjectTimelineItem {
  phase: string
  startDate: string
  endDate: string
  totalTasks: number
  completedTasks: number
}

export interface ProjectRiskItem {
  id: string
  title: string
  assigneeName: string
  endDate: string
  status: TaskStatus
  priority: TaskPriority
}

export interface PublicProjectOverview {
  project: {
    id: string
    name: string
    description?: string | null
  }
  kpi: PublicDashboardKpi
  phaseSummary: Array<{
    phase: string
    total: number
    completed: number
    delayed: number
    progress: number
  }>
  timeline: ProjectTimelineItem[]
  risks: {
    delayed: ProjectRiskItem[]
    dueSoon: ProjectRiskItem[]
  }
  health: ProjectHealth
}

export interface ProjectUpsertPayload {
  name: string
  description?: string
}

export interface SearchFilters {
  q: string
  scope: SearchScopeOption
  status?: TaskStatus
  phase?: string
  projectId?: string
}

export interface SearchTaskResult {
  id: string
  title: string
  phase: string
  status: TaskStatus
  projectId: string
}

export interface SearchProjectResult {
  id: string
  name: string
  description?: string | null
}

export interface SearchMemberResult {
  id: string
  name: string
  role: Role
}

export interface PublicTeamMember {
  id: string
  name: string
  role: Role
  category: string
  taskCount: number
  tasks: Array<{
    id: string
    title: string
    phase: string
  }>
}
