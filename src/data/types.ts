export enum TaskStatus {
    COMPLETED = "completed",
    IN_PROGRESS = "in_progress",
    PENDING = "pending",
    DELAYED = "delayed",
}

export enum TaskPriority {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
}

export interface TeamMember {
    id: string
    name: string
    role: string
    avatar: string
}

export interface Task {
    id: string
    title: string
    phase: string
    assignee: TeamMember
    status: TaskStatus
    priority: TaskPriority
    startDate: string
    endDate: string
    progress: number
    depth: number
    parentId?: string
}

export interface Project {
    id: string
    name: string
    description: string
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    delayedTasks: number
    pendingTasks: number
    overallProgress: number
}

export interface WeeklyData {
    name: string
    planned: number
    completed: number
    resource: number
}

export interface StatusDistribution {
    name: string
    value: number
    color: string
}

export interface PhaseSummary {
    phase: string
    totalTasks: number
    completedTasks: number
    delayedTasks: number
    progress: number
}

export interface MemberSummary {
    memberId: string
    name: string
    role: string
    totalTasks: number
    inProgressTasks: number
    delayedTasks: number
    completionRate: number
}

export interface UserSettings {
    notificationEmail: string
    dailySummary: boolean
    delayedAlerts: boolean
    defaultStartPage: "/" | "/tasks" | "/projects" | "/team-members" | "/settings"
}
