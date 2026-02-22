import { hash } from "bcryptjs"
import { PrismaClient, Role, TaskPriority, TaskStatus } from "@prisma/client"
import { project, tasks, teamMembers } from "../src/data/mock-data"

const prisma = new PrismaClient()

interface SeedMember {
  id: string
  name: string
  role: string
  avatar: string
}

interface SeedTaskInput {
  legacyId: string
  title: string
  phase: string
  assigneeLegacyId: string
  status: TaskStatus
  priority: TaskPriority
  startDate: string
  endDate: string
  progress: number
  parentLegacyId?: string
}

interface ProjectSeed {
  name: string
  description: string
  tasks: SeedTaskInput[]
}

interface SeedConfig {
  members: SeedMember[]
  projects: ProjectSeed[]
}

function toTaskStatus(value: string): TaskStatus {
  switch (value) {
    case "completed":
      return TaskStatus.COMPLETED
    case "in_progress":
      return TaskStatus.IN_PROGRESS
    case "pending":
      return TaskStatus.PENDING
    case "delayed":
      return TaskStatus.DELAYED
    default:
      return TaskStatus.PENDING
  }
}

function toTaskPriority(value: string): TaskPriority {
  switch (value) {
    case "high":
      return TaskPriority.HIGH
    case "medium":
      return TaskPriority.MEDIUM
    case "low":
      return TaskPriority.LOW
    default:
      return TaskPriority.MEDIUM
  }
}

function getSeedConfig(): SeedConfig {
  const additionalMembers: SeedMember[] = [
    { id: "6", name: "강하늘", role: "Data Analyst", avatar: "KH" },
    { id: "7", name: "문지원", role: "QA Automation", avatar: "MJ" },
  ]

  const primaryTasks: SeedTaskInput[] = tasks.map((task) => ({
    legacyId: task.id,
    title: task.title,
    phase: task.phase,
    assigneeLegacyId: task.assignee.id,
    status: toTaskStatus(task.status),
    priority: toTaskPriority(task.priority),
    startDate: task.startDate,
    endDate: task.endDate,
    progress: task.progress,
    parentLegacyId: task.parentId,
  }))

  const leasingTasks: SeedTaskInput[] = [
    {
      legacyId: "l1",
      title: "모바일 임대 프로세스 요구사항 확정",
      phase: "기획",
      assigneeLegacyId: "1",
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      startDate: "2026-02-03",
      endDate: "2026-02-12",
      progress: 100,
    },
    {
      legacyId: "l1-1",
      title: "현장 사용자 인터뷰",
      phase: "기획",
      assigneeLegacyId: "6",
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.MEDIUM,
      startDate: "2026-02-03",
      endDate: "2026-02-07",
      progress: 100,
      parentLegacyId: "l1",
    },
    {
      legacyId: "l2",
      title: "모바일 화면 설계",
      phase: "디자인",
      assigneeLegacyId: "2",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      startDate: "2026-02-10",
      endDate: "2026-02-28",
      progress: 72,
    },
    {
      legacyId: "l3",
      title: "iOS 앱 개발",
      phase: "개발",
      assigneeLegacyId: "3",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      startDate: "2026-02-20",
      endDate: "2026-04-05",
      progress: 48,
    },
    {
      legacyId: "l4",
      title: "Android 앱 개발",
      phase: "개발",
      assigneeLegacyId: "4",
      status: TaskStatus.DELAYED,
      priority: TaskPriority.HIGH,
      startDate: "2026-02-20",
      endDate: "2026-04-01",
      progress: 37,
    },
    {
      legacyId: "l5",
      title: "계약 API 연동",
      phase: "개발",
      assigneeLegacyId: "4",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      startDate: "2026-03-03",
      endDate: "2026-04-10",
      progress: 41,
    },
    {
      legacyId: "l6",
      title: "모바일 QA 회귀 테스트",
      phase: "QA",
      assigneeLegacyId: "7",
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      startDate: "2026-04-02",
      endDate: "2026-04-20",
      progress: 0,
    },
    {
      legacyId: "l6-1",
      title: "기기 호환성 테스트",
      phase: "QA",
      assigneeLegacyId: "7",
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      startDate: "2026-04-05",
      endDate: "2026-04-15",
      progress: 0,
      parentLegacyId: "l6",
    },
    {
      legacyId: "l7",
      title: "앱 스토어 배포 준비",
      phase: "배포",
      assigneeLegacyId: "6",
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      startDate: "2026-04-18",
      endDate: "2026-04-28",
      progress: 0,
    },
  ]

  const analyticsTasks: SeedTaskInput[] = [
    {
      legacyId: "c1",
      title: "세일즈 데이터 모델 재설계",
      phase: "기획",
      assigneeLegacyId: "6",
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      startDate: "2026-01-25",
      endDate: "2026-02-08",
      progress: 100,
    },
    {
      legacyId: "c2",
      title: "대시보드 쿼리 최적화",
      phase: "개발",
      assigneeLegacyId: "4",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      startDate: "2026-02-10",
      endDate: "2026-03-08",
      progress: 54,
    },
    {
      legacyId: "c3",
      title: "영업 파이프라인 UI",
      phase: "개발",
      assigneeLegacyId: "3",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      startDate: "2026-02-13",
      endDate: "2026-03-12",
      progress: 43,
    },
    {
      legacyId: "c3-1",
      title: "리드 상태 보드",
      phase: "개발",
      assigneeLegacyId: "3",
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      startDate: "2026-03-01",
      endDate: "2026-03-20",
      progress: 0,
      parentLegacyId: "c3",
    },
    {
      legacyId: "c4",
      title: "영업 알림 자동화",
      phase: "개발",
      assigneeLegacyId: "5",
      status: TaskStatus.DELAYED,
      priority: TaskPriority.HIGH,
      startDate: "2026-02-22",
      endDate: "2026-03-18",
      progress: 28,
    },
    {
      legacyId: "c5",
      title: "권한 모델 리팩터링",
      phase: "개발",
      assigneeLegacyId: "1",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      startDate: "2026-02-18",
      endDate: "2026-03-25",
      progress: 57,
    },
    {
      legacyId: "c6",
      title: "통합 테스트 자동화",
      phase: "QA",
      assigneeLegacyId: "7",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      startDate: "2026-03-05",
      endDate: "2026-03-31",
      progress: 46,
    },
    {
      legacyId: "c7",
      title: "운영 리포트 템플릿",
      phase: "운영",
      assigneeLegacyId: "2",
      status: TaskStatus.PENDING,
      priority: TaskPriority.LOW,
      startDate: "2026-03-20",
      endDate: "2026-04-10",
      progress: 0,
    },
  ]

  const allMembers = [...teamMembers, ...additionalMembers]

  return {
    members: allMembers,
    projects: [
    {
      name: project.name,
      description: project.description,
      tasks: primaryTasks,
    },
    {
      name: "Smart Leasing Mobile",
      description: "임대 프로세스 모바일 앱 구축 프로젝트",
      tasks: leasingTasks,
    },
    {
      name: "Sales Analytics CRM",
      description: "영업/매출 분석 CRM 고도화 프로젝트",
      tasks: analyticsTasks,
    },
  ],
}
}

async function main() {
  const defaultPassword = await hash("Password123!", 10)

  await prisma.notification.deleteMany()
  await prisma.searchHistory.deleteMany()
  await prisma.searchSynonym.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.task.deleteMany()
  await prisma.project.deleteMany()
  await prisma.profileSettings.deleteMany()
  await prisma.user.deleteMany()

  const seedConfig = getSeedConfig()
  const projectSeeds = seedConfig.projects
  const allMembers = seedConfig.members

  const memberIdToUserId = new Map<string, string>()

  for (const [index, member] of allMembers.entries()) {
    const email = `user${index + 1}@richprop.local`
    const role = index === 0 ? Role.ADMIN : Role.MEMBER

    const user = await prisma.user.create({
      data: {
        email,
        name: member.name,
        role,
        isActive: true,
        passwordHash: defaultPassword,
        settings: {
          create: {
            notificationInApp: true,
            defaultStartPage: "/",
            locale: "ko-KR",
            timezone: "Asia/Seoul",
          },
        },
      },
    })

    memberIdToUserId.set(member.id, user.id)
  }

  const adminUserId = memberIdToUserId.get("1")
  if (!adminUserId) throw new Error("Admin user seed failed")

  const projectNameToId = new Map<string, string>()

  for (const seed of projectSeeds) {
    const createdProject = await prisma.project.create({
      data: {
        name: seed.name,
        description: seed.description,
        createdById: adminUserId,
        isArchived: false,
      },
    })
    projectNameToId.set(createdProject.name, createdProject.id)

    const legacyTaskIdToDbTaskId = new Map<string, string>()

    for (const task of seed.tasks) {
      const assigneeId = memberIdToUserId.get(task.assigneeLegacyId)
      if (!assigneeId) throw new Error(`Unknown assignee for task ${task.legacyId}`)

      const created = await prisma.task.create({
        data: {
          projectId: createdProject.id,
          title: task.title,
          description: null,
          phase: task.phase,
          status: task.status,
          priority: task.priority,
          startDate: new Date(task.startDate),
          endDate: new Date(task.endDate),
          progress: task.progress,
          parentId: null,
          assigneeId,
          createdById: adminUserId,
          updatedById: adminUserId,
        },
      })

      legacyTaskIdToDbTaskId.set(task.legacyId, created.id)
    }

    for (const task of seed.tasks) {
      if (!task.parentLegacyId) continue
      const dbTaskId = legacyTaskIdToDbTaskId.get(task.legacyId)
      const dbParentId = legacyTaskIdToDbTaskId.get(task.parentLegacyId)
      if (!dbTaskId || !dbParentId) continue

      await prisma.task.update({
        where: { id: dbTaskId },
        data: { parentId: dbParentId },
      })
    }
  }

  const synonymSeeds: Array<{
    projectName?: string
    keyword: string
    synonyms: string[]
    isActive?: boolean
  }> = [
    {
      keyword: "\uC548\uB4DC\uB85C\uC774\uB4DC",
      synonyms: ["android"],
    },
    {
      keyword: "\uC544\uC774\uC624\uC5D0\uC2A4",
      synonyms: ["ios"],
    },
    {
      keyword: "\uC544\uC774\uD3F0",
      synonyms: ["iphone"],
    },
    {
      projectName: "Smart Leasing Mobile",
      keyword: "leasing",
      synonyms: ["\uC784\uB300", "rental"],
    },
    {
      projectName: "Sales Analytics CRM",
      keyword: "crm",
      synonyms: ["\uC601\uC5C5", "\uB9E4\uCD9C", "sales"],
    },
  ]

  for (const seed of synonymSeeds) {
    const projectId = seed.projectName ? (projectNameToId.get(seed.projectName) ?? null) : null
    await prisma.searchSynonym.create({
      data: {
        projectId,
        keyword: seed.keyword.toLowerCase(),
        synonyms: Array.from(new Set(seed.synonyms.map((value) => value.toLowerCase()))),
        isActive: seed.isActive ?? true,
        createdById: adminUserId,
        updatedById: adminUserId,
      },
    })
  }

  console.log("Seed complete")
  console.log("Default password: Password123!")
  for (const [index, member] of allMembers.entries()) {
    const roleLabel = index === 0 ? "ADMIN(팀장)" : "MEMBER(팀원)"
    console.log(`${roleLabel}: ${member.name} / user${index + 1}@richprop.local`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
