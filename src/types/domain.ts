export type Role = "ADMIN" | "MEMBER"
export type TaskStatus = "COMPLETED" | "IN_PROGRESS" | "PENDING" | "DELAYED"
export type TaskPriority = "HIGH" | "MEDIUM" | "LOW"
export type NotificationType =
  | "ASSIGNED"
  | "STATUS_CHANGED"
  | "DUE_SOON"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_DELETED"
  | "ASSIGNEE_CHANGED"
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

export interface ProjectHealthSummaryItem {
  id: string
  name: string
  totalTasks: number
  delayedTasks: number
  overallProgress: number
  health: ProjectHealth
}

export interface PortfolioDashboardOverview {
  kpi: PublicDashboardKpi
  weekly: PublicWeeklyMetric[]
  statusDistribution: PublicStatusDistributionItem[]
  recentActivity: Array<{
    id: string
    title: string
    projectId: string
    phase: string
    status: TaskStatus
    progress: number
    startDate: string
    endDate: string
    assignee: {
      id: string
      name: string
      avatarUrl?: string | null
    }
  }>
  projectHealth: ProjectHealthSummaryItem[]
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
  project?: {
    id: string
    name: string
  }
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
  completedAt?: string | null
  completedById?: string | null
  completionNote?: string | null
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

export interface ProjectMemberTaskDetail {
  id: string
  title: string
  phase: string
  status: TaskStatus
  priority: TaskPriority
  startDate: string
  endDate: string
  progress: number
  parentId?: string | null
  depth: number
}

export interface ProjectMemberWorkload {
  memberId: string
  memberName: string
  role?: Role
  totalTasks: number
  inProgressTasks: number
  completedTasks: number
  delayedTasks: number
  pendingTasks: number
  completionRate: number
  tasks: ProjectMemberTaskDetail[]
}

export interface ProjectScheduleLane {
  id: string
  label: string
  laneType: "PHASE" | "MEMBER"
  startDate: string
  endDate: string
  totalTasks: number
  completedTasks: number
  delayedTasks: number
  progress: number
}

export interface ProjectScheduleOverview {
  projectStartDate: string
  projectEndDate: string
  forecastCompletionDate: string
  today: string
  phaseLanes: ProjectScheduleLane[]
  memberLanes: ProjectScheduleLane[]
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
  memberWorkloads: ProjectMemberWorkload[]
  schedule: ProjectScheduleOverview
  health: ProjectHealth
}

export type ProjectDashboardOverview = PublicProjectOverview

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
  limit?: number
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

export interface SearchResponseMeta {
  query: string
  normalizedQuery: string
  tokens: string[]
  tookMs: number
}

export interface SearchApiResponse {
  tasks: SearchTaskResult[]
  projects: SearchProjectResult[]
  members: SearchMemberResult[]
  meta: SearchResponseMeta
}

export interface NormalizedSearchQuery {
  raw: string
  normalized: string
  tokens: string[]
  expandedTokens: string[]
}

export interface SearchSynonymItem {
  id: string
  projectId?: string | null
  projectName?: string | null
  keyword: string
  synonyms: string[]
  isActive: boolean
  updatedAt: string
}

export interface ProjectCompletionSummary {
  id: string
  name: string
  description?: string | null
  completedAt: string
  completedBy: {
    id: string
    name: string
  } | null
  completionNote?: string | null
  totalTasks: number
  completedTasks: number
  overallProgress: number
}

export interface ProjectCompletionHistoryItem {
  id: string
  projectId: string
  action: "PROJECT_COMPLETE" | "PROJECT_REOPEN"
  actor: {
    id: string
    name: string
  } | null
  createdAt: string
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
}

export interface ActivityLogItem {
  id: string
  action: string
  entityType: string
  entityId: string
  actor: {
    id: string
    name: string
    role: Role
  } | null
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  diff?: ActivityDiffRow[]
  createdAt: string
}

export interface ActivityDiffRow {
  fieldPath: string
  beforeValue: unknown
  afterValue: unknown
  changeType: "added" | "removed" | "changed"
}

export interface ActivityLogFilter {
  actorUserId?: string
  entityType?: string
  action?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export interface ProfileOverview {
  account: {
    id: string
    name: string
    email: string
    role: Role
    isActive: boolean
    createdAt: string
  }
  settings: {
    locale: string
    timezone: string
    defaultStartPage: string
  }
  summary: {
    unreadNotifications: number
    myActivityCount7d: number
    myRecentActions: ActivityLogItem[]
  }
}

export interface NotificationFeedItem {
  id: string
  type: NotificationType
  title: string
  body: string
  relatedTaskId?: string | null
  isRead: boolean
  createdAt: string
  canQuickAct?: boolean
}

export interface TaskWithProjectSummary extends PublicTaskSummary {
  project: {
    id: string
    name: string
  }
}

export interface MemberProjectBucket {
  projectId: string
  projectName: string
  total: number
  inProgress: number
  completed: number
  delayed: number
  pending: number
}

export interface AdminModeState {
  enabled: boolean
  toggle: () => void
  setEnabled: (value: boolean) => void
}

export interface PublicTeamMember {
  id: string
  name: string
  role: Role
  category: string
  taskCount: number
  inProgressCount: number
  topTaskTitles: string[]
  projectBuckets?: MemberProjectBucket[]
}

export interface MemberExecutionTask {
  id: string
  title: string
  phase: string
  projectId: string
  projectName: string
  status: TaskStatus
  priority: TaskPriority
  startDate: string
  endDate: string
  progress: number
}

export interface MemberExecutionProjectBucket {
  projectId: string
  projectName: string
  inProgressCount: number
  delayedCount: number
  pendingCount: number
  completedCount: number
  tasks: MemberExecutionTask[]
}

export interface MemberExecutionView {
  memberId: string
  memberName: string
  role: Role
  totalInProgress: number
  projects: MemberExecutionProjectBucket[]
}

export interface TeamMembersExecutionResponse {
  members: MemberExecutionView[]
  summary: {
    members: number
    projects: number
    inProgressTasks: number
  }
}

export interface SlaMetrics {
  inProgressCount: number
  delayedCount: number
  delayedRate: number
  overdueOpenCount: number
  overdueOpenRate: number
  dueSoon7dCount: number
  completionRatio: number
}

export interface WeeklyTeamReport {
  weekStart: string
  summary: {
    totalTasks: number
    inProgressTasks: number
    completedTasks: number
    delayedTasks: number
    pendingTasks: number
  }
  sla: SlaMetrics
  members: Array<{
    memberId: string
    memberName: string
    role: Role
    totalTasks: number
    inProgressTasks: number
    completedTasks: number
    delayedTasks: number
    pendingTasks: number
    overdueOpenCount: number
    completionRatio: number
  }>
  projects: Array<{
    projectId: string
    projectName: string
    totalTasks: number
    inProgressTasks: number
    completedTasks: number
    delayedTasks: number
    pendingTasks: number
    overdueOpenCount: number
    completionRatio: number
  }>
}

export interface TeamWeeklySnapshotItem {
  id: string
  weekStart: string
  generatedBy: {
    id: string
    name: string
  }
  createdAt: string
  summary: WeeklyTeamReport["summary"]
  sla: SlaMetrics
}

export interface NotificationQuickActionPayload {
  actionType: "CHANGE_STATUS" | "CHANGE_ASSIGNEE"
  status?: TaskStatus
  assigneeId?: string
}
