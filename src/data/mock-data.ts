// Mock data for dashboard and tasks
import { TaskStatus, TaskPriority, type Task, type Project, type TeamMember, type WeeklyData, type StatusDistribution } from "./types"

export const teamMembers: TeamMember[] = [
    { id: "1", name: "김민수", role: "PM", avatar: "KM" },
    { id: "2", name: "이지은", role: "Designer", avatar: "LJ" },
    { id: "3", name: "박서준", role: "Frontend", avatar: "PS" },
    { id: "4", name: "최예린", role: "Backend", avatar: "CY" },
    { id: "5", name: "정도현", role: "QA", avatar: "JD" },
]

export const tasks: Task[] = [
    // Phase: 기획 (Planning)
    { id: "t1", title: "요구사항 분석", phase: "기획", assignee: teamMembers[0], status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, startDate: "2026-01-05", endDate: "2026-01-15", progress: 100, depth: 0 },
    { id: "t1-1", title: "사용자 인터뷰 진행", phase: "기획", assignee: teamMembers[0], status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, startDate: "2026-01-05", endDate: "2026-01-09", progress: 100, depth: 1, parentId: "t1" },
    { id: "t1-2", title: "경쟁사 분석 보고서", phase: "기획", assignee: teamMembers[4], status: TaskStatus.COMPLETED, priority: TaskPriority.LOW, startDate: "2026-01-10", endDate: "2026-01-15", progress: 100, depth: 1, parentId: "t1" },
    { id: "t2", title: "프로젝트 스코프 확정", phase: "기획", assignee: teamMembers[0], status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, startDate: "2026-01-16", endDate: "2026-01-20", progress: 100, depth: 0 },

    // Phase: 디자인 (Design)
    { id: "t3", title: "UI/UX 디자인", phase: "디자인", assignee: teamMembers[1], status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, startDate: "2026-01-21", endDate: "2026-02-10", progress: 80, depth: 0 },
    { id: "t3-1", title: "와이어프레임 작성", phase: "디자인", assignee: teamMembers[1], status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, startDate: "2026-01-21", endDate: "2026-01-28", progress: 100, depth: 1, parentId: "t3" },
    { id: "t3-2", title: "디자인 시스템 구축", phase: "디자인", assignee: teamMembers[1], status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, startDate: "2026-01-29", endDate: "2026-02-05", progress: 70, depth: 1, parentId: "t3" },
    { id: "t3-3", title: "프로토타입 제작", phase: "디자인", assignee: teamMembers[1], status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, startDate: "2026-02-06", endDate: "2026-02-10", progress: 0, depth: 1, parentId: "t3" },

    // Phase: 개발 (Development)
    { id: "t4", title: "프론트엔드 개발", phase: "개발", assignee: teamMembers[2], status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, startDate: "2026-02-01", endDate: "2026-03-15", progress: 45, depth: 0 },
    { id: "t4-1", title: "대시보드 페이지 개발", phase: "개발", assignee: teamMembers[2], status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, startDate: "2026-02-01", endDate: "2026-02-15", progress: 60, depth: 1, parentId: "t4" },
    { id: "t4-2", title: "작업관리 페이지 개발", phase: "개발", assignee: teamMembers[2], status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, startDate: "2026-02-10", endDate: "2026-02-28", progress: 30, depth: 1, parentId: "t4" },
    { id: "t4-3", title: "인증 및 사용자 관리", phase: "개발", assignee: teamMembers[2], status: TaskStatus.PENDING, priority: TaskPriority.HIGH, startDate: "2026-03-01", endDate: "2026-03-15", progress: 0, depth: 1, parentId: "t4" },
    { id: "t5", title: "백엔드 API 개발", phase: "개발", assignee: teamMembers[3], status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, startDate: "2026-02-01", endDate: "2026-03-10", progress: 55, depth: 0 },
    { id: "t5-1", title: "REST API 설계", phase: "개발", assignee: teamMembers[3], status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, startDate: "2026-02-01", endDate: "2026-02-08", progress: 100, depth: 1, parentId: "t5" },
    { id: "t5-2", title: "데이터베이스 스키마 설계", phase: "개발", assignee: teamMembers[3], status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, startDate: "2026-02-05", endDate: "2026-02-12", progress: 100, depth: 1, parentId: "t5" },
    { id: "t5-3", title: "CRUD API 구현", phase: "개발", assignee: teamMembers[3], status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, startDate: "2026-02-13", endDate: "2026-03-01", progress: 40, depth: 1, parentId: "t5" },
    { id: "t5-4", title: "실시간 알림 시스템", phase: "개발", assignee: teamMembers[3], status: TaskStatus.DELAYED, priority: TaskPriority.LOW, startDate: "2026-02-20", endDate: "2026-03-10", progress: 10, depth: 1, parentId: "t5" },

    // Phase: QA/테스트
    { id: "t6", title: "통합 테스트", phase: "QA", assignee: teamMembers[4], status: TaskStatus.PENDING, priority: TaskPriority.HIGH, startDate: "2026-03-10", endDate: "2026-03-20", progress: 0, depth: 0 },
    { id: "t6-1", title: "E2E 테스트 시나리오 작성", phase: "QA", assignee: teamMembers[4], status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, startDate: "2026-03-10", endDate: "2026-03-14", progress: 0, depth: 1, parentId: "t6" },
    { id: "t6-2", title: "성능 테스트", phase: "QA", assignee: teamMembers[4], status: TaskStatus.DELAYED, priority: TaskPriority.LOW, startDate: "2026-03-15", endDate: "2026-03-20", progress: 0, depth: 1, parentId: "t6" },
    { id: "t7", title: "UAT 및 배포 준비", phase: "QA", assignee: teamMembers[0], status: TaskStatus.PENDING, priority: TaskPriority.HIGH, startDate: "2026-03-21", endDate: "2026-03-30", progress: 0, depth: 0 },
]

export const weeklyData: WeeklyData[] = [
    { name: "1주차", planned: 8, completed: 7, resource: 85 },
    { name: "2주차", planned: 12, completed: 10, resource: 90 },
    { name: "3주차", planned: 10, completed: 9, resource: 78 },
    { name: "4주차", planned: 15, completed: 11, resource: 92 },
    { name: "5주차", planned: 14, completed: 13, resource: 88 },
    { name: "6주차", planned: 11, completed: 8, resource: 75 },
    { name: "7주차", planned: 16, completed: 12, resource: 95 },
    { name: "8주차", planned: 13, completed: 10, resource: 82 },
]

export const statusDistribution: StatusDistribution[] = [
    { name: "완료", value: 7, color: "#10b981" },
    { name: "진행중", value: 6, color: "#3b82f6" },
    { name: "대기", value: 5, color: "#f59e0b" },
    { name: "지연", value: 3, color: "#ef4444" },
]

export const project: Project = {
    id: "p1",
    name: "Rich Properties Platform",
    description: "부동산 관리 플랫폼 v2.0",
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
    inProgressTasks: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    delayedTasks: tasks.filter(t => t.status === TaskStatus.DELAYED).length,
    pendingTasks: tasks.filter(t => t.status === TaskStatus.PENDING).length,
    overallProgress: 48,
}
