import { hash } from "bcryptjs"
import { PrismaClient, Role, TaskPriority, TaskStatus } from "@prisma/client"

const prisma = new PrismaClient()

interface SeedMember {
  legacyId: string
  name: string
  jobTitle: string
  avatar: string
  isLead?: boolean
}

interface SeedTaskInput {
  legacyId: string
  title: string
  description: string
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

interface SearchSynonymSeed {
  projectName?: string
  keyword: string
  synonyms: string[]
  isActive?: boolean
}

interface SeedConfig {
  members: SeedMember[]
  projects: ProjectSeed[]
  searchSynonyms: SearchSynonymSeed[]
}

function getSeedConfig(): SeedConfig {
  const members: SeedMember[] = [
    { legacyId: "1", name: "김민수", jobTitle: "팀장 / PM", avatar: "KM", isLead: true },
    { legacyId: "2", name: "이지은", jobTitle: "Product Designer", avatar: "LJ" },
    { legacyId: "3", name: "박서준", jobTitle: "Frontend Engineer", avatar: "PS" },
    { legacyId: "4", name: "최예린", jobTitle: "Backend Engineer", avatar: "CY" },
    { legacyId: "5", name: "정도현", jobTitle: "QA Engineer", avatar: "JD" },
    { legacyId: "6", name: "강하늘", jobTitle: "Data Analyst", avatar: "KH" },
  ]

  const projects: ProjectSeed[] = [
    {
      name: "Rich Properties Platform v2.0",
      description: "부동산 운영 대시보드 고도화 및 성능 안정화",
      tasks: [
        {
          legacyId: "rp-1",
          title: "2분기 제품 로드맵 확정",
          description: "영업/운영/CS 요구사항을 반영해 기능 우선순위를 확정합니다.",
          phase: "기획",
          assigneeLegacyId: "1",
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.HIGH,
          startDate: "2026-01-06",
          endDate: "2026-01-16",
          progress: 100,
        },
        {
          legacyId: "rp-2",
          title: "디자인 시스템 토큰 정리",
          description: "공통 컴포넌트 색상/간격 토큰을 재정의하고 가이드를 반영합니다.",
          phase: "디자인",
          assigneeLegacyId: "2",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          startDate: "2026-01-17",
          endDate: "2026-02-10",
          progress: 76,
        },
        {
          legacyId: "rp-2-1",
          title: "핵심 화면 와이어프레임 업데이트",
          description: "대시보드, 작업 목록, 프로젝트 상세 화면 와이어프레임을 갱신합니다.",
          phase: "디자인",
          assigneeLegacyId: "2",
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.MEDIUM,
          startDate: "2026-01-17",
          endDate: "2026-01-27",
          progress: 100,
          parentLegacyId: "rp-2",
        },
        {
          legacyId: "rp-3",
          title: "매물 상세 화면 프론트 리팩터링",
          description: "렌더링 성능 개선과 상태 관리 단순화를 목표로 코드 구조를 개선합니다.",
          phase: "개발",
          assigneeLegacyId: "3",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          startDate: "2026-01-20",
          endDate: "2026-02-25",
          progress: 58,
        },
        {
          legacyId: "rp-4",
          title: "계약/결제 API 안정화",
          description: "타임아웃과 중복 요청 이슈를 줄이기 위한 트랜잭션 처리 개선 작업입니다.",
          phase: "개발",
          assigneeLegacyId: "4",
          status: TaskStatus.DELAYED,
          priority: TaskPriority.HIGH,
          startDate: "2026-01-22",
          endDate: "2026-02-21",
          progress: 41,
        },
        {
          legacyId: "rp-5",
          title: "회귀 테스트 시나리오 재작성",
          description: "주요 사용자 플로우 기준으로 E2E 테스트 커버리지를 재정의합니다.",
          phase: "QA",
          assigneeLegacyId: "5",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
          startDate: "2026-02-01",
          endDate: "2026-02-28",
          progress: 47,
        },
        {
          legacyId: "rp-6",
          title: "주간 KPI 리포트 자동 생성",
          description: "거래량/체류시간/전환율 지표를 자동 집계해 운영 리포트를 생성합니다.",
          phase: "운영",
          assigneeLegacyId: "6",
          status: TaskStatus.PENDING,
          priority: TaskPriority.MEDIUM,
          startDate: "2026-02-20",
          endDate: "2026-03-18",
          progress: 0,
        },
      ],
    },
    {
      name: "Smart Leasing Mobile",
      description: "임대 신청 모바일 전환 프로젝트",
      tasks: [
        {
          legacyId: "sl-1",
          title: "모바일 임대 프로세스 요구사항 확정",
          description: "오프라인 신청 절차를 모바일 기준으로 재설계하고 승인합니다.",
          phase: "기획",
          assigneeLegacyId: "1",
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.HIGH,
          startDate: "2026-02-03",
          endDate: "2026-02-12",
          progress: 100,
        },
        {
          legacyId: "sl-2",
          title: "온보딩/신청서 UX 설계",
          description: "초기 이탈률을 줄이기 위한 단계형 온보딩 UI를 설계합니다.",
          phase: "디자인",
          assigneeLegacyId: "2",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          startDate: "2026-02-10",
          endDate: "2026-02-28",
          progress: 72,
        },
        {
          legacyId: "sl-3",
          title: "iOS 임대 신청 화면 개발",
          description: "신청/수정/저장 플로우를 iOS 앱에서 동작하도록 구현합니다.",
          phase: "개발",
          assigneeLegacyId: "3",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          startDate: "2026-02-20",
          endDate: "2026-04-05",
          progress: 48,
        },
        {
          legacyId: "sl-4",
          title: "임대 계약 API 연동",
          description: "모바일 앱과 계약 서비스 간 인증/서명 API를 연동합니다.",
          phase: "개발",
          assigneeLegacyId: "4",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          startDate: "2026-02-20",
          endDate: "2026-04-01",
          progress: 52,
        },
        {
          legacyId: "sl-5",
          title: "모바일 회귀 테스트",
          description: "주요 기기 조합 기준으로 임대 신청 흐름을 회귀 테스트합니다.",
          phase: "QA",
          assigneeLegacyId: "5",
          status: TaskStatus.PENDING,
          priority: TaskPriority.HIGH,
          startDate: "2026-04-02",
          endDate: "2026-04-20",
          progress: 0,
        },
        {
          legacyId: "sl-6",
          title: "모바일 퍼널 지표 대시보드 구축",
          description: "회원가입-신청완료 구간별 이탈률을 실시간 확인하도록 구성합니다.",
          phase: "분석",
          assigneeLegacyId: "6",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
          startDate: "2026-03-03",
          endDate: "2026-04-10",
          progress: 39,
        },
        {
          legacyId: "sl-6-1",
          title: "신청서 이탈 구간 코호트 분석",
          description: "OS/유입채널 기준 이탈 코호트를 산출해 개선 우선순위를 제안합니다.",
          phase: "분석",
          assigneeLegacyId: "6",
          status: TaskStatus.PENDING,
          priority: TaskPriority.MEDIUM,
          startDate: "2026-03-15",
          endDate: "2026-03-28",
          progress: 0,
          parentLegacyId: "sl-6",
        },
      ],
    },
    {
      name: "Sales Analytics CRM",
      description: "영업 파이프라인 분석과 운영 자동화 고도화",
      tasks: [
        {
          legacyId: "sa-1",
          title: "세일즈 파이프라인 운영 정책 정리",
          description: "리드 상태 정의와 단계별 SLA를 문서화하고 부서 합의를 완료합니다.",
          phase: "기획",
          assigneeLegacyId: "1",
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.HIGH,
          startDate: "2026-01-25",
          endDate: "2026-02-08",
          progress: 100,
        },
        {
          legacyId: "sa-2",
          title: "영업 퍼널 UI 개선 디자인",
          description: "대시보드 가독성 향상을 위한 차트/필터 인터랙션을 재설계합니다.",
          phase: "디자인",
          assigneeLegacyId: "2",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
          startDate: "2026-02-10",
          endDate: "2026-03-05",
          progress: 63,
        },
        {
          legacyId: "sa-3",
          title: "리드 상태 보드 프론트 개발",
          description: "드래그 앤 드롭 기반 상태 전환 보드를 구현합니다.",
          phase: "개발",
          assigneeLegacyId: "3",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          startDate: "2026-02-13",
          endDate: "2026-03-12",
          progress: 43,
        },
        {
          legacyId: "sa-4",
          title: "영업 쿼리 최적화 및 캐싱",
          description: "지연이 큰 집계 쿼리를 튜닝하고 캐시 정책을 도입합니다.",
          phase: "개발",
          assigneeLegacyId: "4",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          startDate: "2026-02-10",
          endDate: "2026-03-08",
          progress: 54,
        },
        {
          legacyId: "sa-5",
          title: "통합 테스트 자동화",
          description: "권한/상태 전환 케이스를 중심으로 CI 자동 테스트를 강화합니다.",
          phase: "QA",
          assigneeLegacyId: "5",
          status: TaskStatus.DELAYED,
          priority: TaskPriority.MEDIUM,
          startDate: "2026-03-05",
          endDate: "2026-03-31",
          progress: 28,
        },
        {
          legacyId: "sa-6",
          title: "영업 KPI 기준값 정의",
          description: "채널별 전환율과 리드 응답시간 KPI 기준값을 재설정합니다.",
          phase: "분석",
          assigneeLegacyId: "6",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          startDate: "2026-02-18",
          endDate: "2026-03-25",
          progress: 57,
        },
        {
          legacyId: "sa-6-1",
          title: "주차별 KPI 스냅샷 템플릿 작성",
          description: "팀 리포트용 주간 KPI 스냅샷 템플릿을 작성합니다.",
          phase: "분석",
          assigneeLegacyId: "6",
          status: TaskStatus.PENDING,
          priority: TaskPriority.LOW,
          startDate: "2026-03-20",
          endDate: "2026-04-10",
          progress: 0,
          parentLegacyId: "sa-6",
        },
      ],
    },
    {
      name: "Resident Portal Renewal",
      description: "입주민 민원/공지 포털 리뉴얼 및 운영 효율화",
      tasks: [
        {
          legacyId: "rr-1",
          title: "입주민 포털 개편 범위 확정",
          description: "민원, 공지, 시설예약 범위를 1차 릴리스 기준으로 확정합니다.",
          phase: "기획",
          assigneeLegacyId: "1",
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.HIGH,
          startDate: "2026-03-01",
          endDate: "2026-03-10",
          progress: 100,
        },
        {
          legacyId: "rr-2",
          title: "서비스 신청 플로우 디자인",
          description: "입주민이 모바일에서 민원/시설예약을 빠르게 신청할 수 있도록 설계합니다.",
          phase: "디자인",
          assigneeLegacyId: "2",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          startDate: "2026-03-11",
          endDate: "2026-03-31",
          progress: 68,
        },
        {
          legacyId: "rr-3",
          title: "민원 접수 화면 구현",
          description: "파일 첨부와 상태 추적이 가능한 민원 접수/조회 화면을 개발합니다.",
          phase: "개발",
          assigneeLegacyId: "3",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          startDate: "2026-03-15",
          endDate: "2026-04-18",
          progress: 44,
        },
        {
          legacyId: "rr-4",
          title: "민원 처리 워크플로 API 구축",
          description: "접수-처리중-완료 상태 전환과 담당자 배정 API를 구현합니다.",
          phase: "개발",
          assigneeLegacyId: "4",
          status: TaskStatus.PENDING,
          priority: TaskPriority.HIGH,
          startDate: "2026-03-20",
          endDate: "2026-04-22",
          progress: 0,
        },
        {
          legacyId: "rr-5",
          title: "접근성/브라우저 호환 QA",
          description: "웹 접근성 체크리스트와 브라우저 호환 테스트를 수행합니다.",
          phase: "QA",
          assigneeLegacyId: "5",
          status: TaskStatus.PENDING,
          priority: TaskPriority.MEDIUM,
          startDate: "2026-04-10",
          endDate: "2026-04-30",
          progress: 0,
        },
        {
          legacyId: "rr-6",
          title: "민원 유형별 처리시간 분석",
          description: "민원 유형별 평균 처리시간을 분석해 병목 구간을 도출합니다.",
          phase: "분석",
          assigneeLegacyId: "6",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
          startDate: "2026-03-22",
          endDate: "2026-04-15",
          progress: 36,
        },
        {
          legacyId: "rr-6-1",
          title: "운영 개선 우선순위 리포트",
          description: "분석 결과를 바탕으로 운영팀 개선 우선순위를 제안합니다.",
          phase: "운영",
          assigneeLegacyId: "1",
          status: TaskStatus.PENDING,
          priority: TaskPriority.MEDIUM,
          startDate: "2026-04-16",
          endDate: "2026-04-23",
          progress: 0,
          parentLegacyId: "rr-6",
        },
      ],
    },
    {
      name: "Field Operations Automation",
      description: "현장 점검/작업 배정 자동화를 통한 운영 비용 절감",
      tasks: [
        {
          legacyId: "fo-1",
          title: "현장 자동화 요구사항 확정",
          description: "점검/보수/정산 프로세스의 자동화 범위와 우선순위를 확정합니다.",
          phase: "기획",
          assigneeLegacyId: "1",
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.HIGH,
          startDate: "2026-03-10",
          endDate: "2026-03-18",
          progress: 100,
        },
        {
          legacyId: "fo-2",
          title: "모바일 체크리스트 UI 설계",
          description: "현장 엔지니어가 오프라인에서도 입력 가능한 UX를 설계합니다.",
          phase: "디자인",
          assigneeLegacyId: "2",
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.MEDIUM,
          startDate: "2026-03-19",
          endDate: "2026-03-29",
          progress: 100,
        },
        {
          legacyId: "fo-3",
          title: "오프라인 입력 프론트 구현",
          description: "네트워크 단절 상황에서도 작업 입력이 가능한 동기화 로직을 구현합니다.",
          phase: "개발",
          assigneeLegacyId: "3",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          startDate: "2026-03-25",
          endDate: "2026-05-05",
          progress: 51,
        },
        {
          legacyId: "fo-4",
          title: "작업 배정 스케줄러 API 개발",
          description: "지역/우선순위 기반 자동 배정 스케줄러를 구현합니다.",
          phase: "개발",
          assigneeLegacyId: "4",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          startDate: "2026-03-25",
          endDate: "2026-05-01",
          progress: 46,
        },
        {
          legacyId: "fo-5",
          title: "현장 시나리오 E2E 테스트",
          description: "작업 생성-배정-완료-검수 흐름에 대한 E2E 테스트를 자동화합니다.",
          phase: "QA",
          assigneeLegacyId: "5",
          status: TaskStatus.PENDING,
          priority: TaskPriority.HIGH,
          startDate: "2026-05-02",
          endDate: "2026-05-24",
          progress: 0,
        },
        {
          legacyId: "fo-6",
          title: "운영 지표/알림 규칙 설계",
          description: "지연 작업 감지와 SLA 위반 알림 규칙을 정의합니다.",
          phase: "분석",
          assigneeLegacyId: "6",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
          startDate: "2026-04-02",
          endDate: "2026-05-10",
          progress: 33,
        },
        {
          legacyId: "fo-6-1",
          title: "현장 인력 가동률 리포트 자동화",
          description: "일일 가동률 리포트 생성 배치를 작성하고 배포합니다.",
          phase: "운영",
          assigneeLegacyId: "6",
          status: TaskStatus.PENDING,
          priority: TaskPriority.LOW,
          startDate: "2026-05-11",
          endDate: "2026-05-27",
          progress: 0,
          parentLegacyId: "fo-6",
        },
      ],
    },
  ]

  const searchSynonyms: SearchSynonymSeed[] = [
    { keyword: "안드로이드", synonyms: ["android"] },
    { keyword: "아이오에스", synonyms: ["ios"] },
    { keyword: "아이폰", synonyms: ["iphone"] },
    { keyword: "대시보드", synonyms: ["dashboard", "board"] },
    {
      projectName: "Smart Leasing Mobile",
      keyword: "leasing",
      synonyms: ["임대", "rental"],
    },
    {
      projectName: "Sales Analytics CRM",
      keyword: "crm",
      synonyms: ["영업", "매출", "sales"],
    },
    {
      projectName: "Resident Portal Renewal",
      keyword: "민원",
      synonyms: ["resident", "cs", "ticket"],
    },
    {
      projectName: "Field Operations Automation",
      keyword: "현장",
      synonyms: ["field", "ops", "점검"],
    },
  ]

  return {
    members,
    projects,
    searchSynonyms,
  }
}

async function main() {
  const defaultPassword = await hash("Password123!", 10)
  const seedConfig = getSeedConfig()

  await prisma.notification.deleteMany()
  await prisma.searchHistory.deleteMany()
  await prisma.searchSynonym.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.task.deleteMany()
  await prisma.project.deleteMany()
  await prisma.profileSettings.deleteMany()
  await prisma.user.deleteMany()

  const memberIdToUserId = new Map<string, string>()

  for (const [index, member] of seedConfig.members.entries()) {
    const user = await prisma.user.create({
      data: {
        email: `user${index + 1}@richprop.local`,
        name: member.name,
        role: member.isLead ? Role.ADMIN : Role.MEMBER,
        isActive: true,
        avatarUrl: member.avatar,
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

    memberIdToUserId.set(member.legacyId, user.id)
  }

  const leadLegacyId = seedConfig.members.find((member) => member.isLead)?.legacyId ?? "1"
  const leadUserId = memberIdToUserId.get(leadLegacyId)
  if (!leadUserId) throw new Error("Team lead user seed failed")

  const projectNameToId = new Map<string, string>()

  for (const seedProject of seedConfig.projects) {
    const createdProject = await prisma.project.create({
      data: {
        name: seedProject.name,
        description: seedProject.description,
        createdById: leadUserId,
        isArchived: false,
      },
    })

    projectNameToId.set(createdProject.name, createdProject.id)

    const legacyTaskIdToDbTaskId = new Map<string, string>()

    for (const task of seedProject.tasks) {
      const assigneeId = memberIdToUserId.get(task.assigneeLegacyId)
      if (!assigneeId) throw new Error(`Unknown assignee for task ${task.legacyId}`)

      const createdTask = await prisma.task.create({
        data: {
          projectId: createdProject.id,
          title: task.title,
          description: task.description,
          phase: task.phase,
          status: task.status,
          priority: task.priority,
          startDate: new Date(task.startDate),
          endDate: new Date(task.endDate),
          progress: task.progress,
          parentId: null,
          assigneeId,
          createdById: leadUserId,
          updatedById: leadUserId,
        },
      })

      legacyTaskIdToDbTaskId.set(task.legacyId, createdTask.id)
    }

    for (const task of seedProject.tasks) {
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

  for (const synonym of seedConfig.searchSynonyms) {
    const projectId = synonym.projectName ? (projectNameToId.get(synonym.projectName) ?? null) : null

    await prisma.searchSynonym.create({
      data: {
        projectId,
        keyword: synonym.keyword.toLowerCase(),
        synonyms: Array.from(new Set(synonym.synonyms.map((value) => value.toLowerCase()))),
        isActive: synonym.isActive ?? true,
        createdById: leadUserId,
        updatedById: leadUserId,
      },
    })
  }

  console.log("Seed complete")
  console.log("Default password: Password123!")
  for (const [index, member] of seedConfig.members.entries()) {
    const roleLabel = member.isLead ? "ADMIN(팀장)" : "MEMBER(팀원)"
    console.log(`${roleLabel}: ${member.name} (${member.jobTitle}) / user${index + 1}@richprop.local`)
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
