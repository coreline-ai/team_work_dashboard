# 08. Replication Playbook

## 8.1 목표
이 플레이북은 Coreline과 **동일한 시각 구조/정보 밀도/상태 표현**을 다른 프로젝트에서 재현하기 위한 실행 절차입니다.

## 8.2 사전 준비
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 기술 스택 정합성 | Next.js App Router + Tailwind v4 + React 컴포넌트 패턴 권장 | `@import "tailwindcss"` 기반 | `src/app/globals.css:1` |
| 기본 폰트 | Inter 적용 필수 | `Inter({ subsets:["latin"] })` | `src/app/layout.tsx:2,7` |
| 라이트 테마 고정 | 초기 단계에서 다크모드 제외 | `bg-slate-50`, `bg-white`, `text-slate-*` | `src/app/layout.tsx:21`, `src/components/ui/card.tsx:5` |
| Breakpoint 기준 | `sm=640`, `md=768`, `lg=1024`, `xl=1280` | `sm/md/lg/xl` | `node_modules/tailwindcss/theme.css:327-330` |

## 8.3 구현 순서 (권장)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Step 1: Token 설정 | 배경/전경/스크롤바/상태색/차트색 먼저 고정 | `:root`, `@theme`, `::-webkit-scrollbar` | `src/app/globals.css:3-35`, `src/components/dashboard/*` |
| Step 2: 도메인 독립 테마 계약 | semantic CSS 속성 계약(`surface/text/status/accent/elevation`)을 먼저 확정하고 도메인 색상은 매핑으로 처리 | `:root --color-*`, `[data-domain-theme]` 전략 | `docs/design/10-css-theme-unification-spec.md` |
| Step 3: Shell 구축 | Sidebar/Header/Main 스켈레톤 우선 구현 | `w-64`, `h-16`, `overflow-y-auto` | `src/components/layout/app-shell.tsx:24-27`, `src/components/layout/header.tsx:314` |
| Step 4: UI 컴포넌트 | Button/Card/Badge/Avatar를 먼저 만들고 페이지는 조합 | `src/components/ui/*` | `src/components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `avatar.tsx` |
| Step 5: Public 화면 | Portfolio → Projects → Tasks → Team Members → Search 순으로 구현 | `max-w-7xl + card/table/grid` 패턴 | `src/app/projects/page.tsx:221-401`, `src/app/tasks/page.tsx:407-742` |
| Step 6: Protected/Admin | Settings/Completed/Activity/Reports + 관리자 패널 구현 | `data-testid="*-admin-*"` | `src/app/settings/page.tsx:327-470`, `src/app/projects/page.tsx:405-538` |
| Step 7: Overlay/상태 | Header dropdown/popup/modal/expand state 구현 | `z-30`, `absolute`, `fixed inset-0` | `src/components/layout/header.tsx:375-616`, `src/app/projects/page.tsx:499-538` |

## 8.4 최소 컴포넌트 세트
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Layout primitives | AppShell, Sidebar, Header, Main container | `w-64`, `h-16`, `max-w-7xl` | `src/components/layout/app-shell.tsx:24-27`, `src/components/layout/sidebar.tsx:45` |
| Surface primitives | Card 계열 5종(Card/Header/Title/Description/Content) | `rounded-xl border bg-white shadow-sm` | `src/components/ui/card.tsx:4-34` |
| Action primitives | Button variant/size 6x4 조합 | `variant + size` | `src/components/ui/button.tsx:4-29` |
| Status primitives | Badge variant 8종 + status/health meta map | `bg-*-100 text-*-700` | `src/components/ui/badge.tsx:4-29`, `src/app/tasks/page.tsx:69-84` |
| Data primitives | Table wrapper, MiniStat, progress bar | `overflow-x-auto table`, `rounded-md border bg-slate-50` | `src/app/projects/page.tsx:298`, `src/app/team-reports/page.tsx:396-402` |
| Overlay primitives | Dropdown, Popover, Modal, Expand row | `absolute ... z-30`, `fixed inset-0` | `src/components/layout/header.tsx:375-616`, `src/app/activity-log/page.tsx:240-295` |

## 8.5 화면 구현 체크리스트
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Public Dashboard | Hero gradient + KPI + charts + health map + recent table | `bg-gradient-to-r`, `grid xl:grid-cols-7`, `table` | `src/components/dashboard/portfolio-dashboard-page.tsx:66-151` |
| Public Project Detail | Hero + KPI + phase/status charts + gantt + member workloads + risk top | `data-testid="project-schedule-gantt"` | `src/components/dashboard/project-dashboard-page.tsx:504-830` |
| Tasks | 필터 + 그룹 테이블 + optional board | `grid-cols-2 md:grid-cols-5`, `xl:grid-cols-4` | `src/app/tasks/page.tsx:531-742` |
| Projects | 좌 목록/우 상세 2분할 + 관리자 패널 분리 | `xl:grid-cols-[340px,1fr]` | `src/app/projects/page.tsx:227-538` |
| Team Members | 공개 요약 표 + 로그인 상세 확장 + 관리자 패널 | `team-public-summary`, `team-execution-section` | `src/app/team-members/page.tsx:268-609` |
| Search | 5열 필터 + 3열 결과 | `md:grid-cols-5`, `xl:grid-cols-3` | `src/app/search/page.tsx:168-316` |
| Auth + Protected | 로그인/회원가입/설정/완료/활동/리포트 | 카드/표 패턴 통일 | `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/settings/page.tsx`, `src/app/completed-projects/page.tsx`, `src/app/activity-log/page.tsx`, `src/app/team-reports/page.tsx` |

## 8.6 운영 상태 구현 체크리스트
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Loading state | 각 페이지/카드에 로딩 텍스트 존재 | `text-sm text-slate-500` | 다수 페이지 (`src/app/*`, `src/components/dashboard/*`) |
| Empty state | 테이블 row 또는 섹션 메시지로 처리 | `colSpan + text-slate-500` | `src/app/team-reports/page.tsx:294-297`, `src/app/tasks/page.tsx:699` |
| Error state | 요청 실패 시 red 텍스트 | `text-red-600` | `src/app/login/page.tsx:82`, `src/app/search/page.tsx:250` |
| Disabled state | 버튼 비활성 시 opacity/이벤트 차단 | `disabled:pointer-events-none disabled:opacity-50` | `src/components/ui/button.tsx:15` |
| Overlay close rule | 외부 클릭/Escape/route 변경 시 닫기 | document listener + state reset | `src/components/layout/header.tsx:149-191` |

## 8.7 이식 시 주의사항
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| `max-w-7xl` 유지 | 콘텐츠 폭이 넓어지면 표 가독성 저하 | `max-w-7xl mx-auto` | `src/app/tasks/page.tsx:407`, `src/app/projects/page.tsx:221` |
| 표 패턴 유지 | 카드 리스트로 치환하면 운영 정보 밀도 저하 가능 | `overflow-x-auto + table` | `src/app/activity-log/page.tsx:205`, `src/app/completed-projects/page.tsx:106` |
| 상태 색상 일관성 | status/health 색을 화면별 임의 변경 금지 | `emerald/blue/amber/rose` 통일 | `src/components/ui/badge.tsx:17-20`, `src/app/projects/page.tsx:23-27` |
| Admin UI 분리 | 일반 사용자 화면과 관리 화면을 분리해야 유지보수 용이 | `showAdminControls` 조건 렌더링 | `src/app/projects/page.tsx:35-38,404`, `src/app/team-members/page.tsx:69-72,500` |

## 8.8 완료 기준 (Definition of Done)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 라우트 커버리지 | 계획에 명시된 화면이 모두 구현되어야 함 | page route 기준 | `src/app/**/page.tsx` |
| 컴포넌트 커버리지 | Button/Card/Badge/Avatar + 표 + MiniStat + Overlay 구현 | 공통 컴포넌트 파일 존재/사용 | `src/components/ui/*`, `src/components/layout/header.tsx` |
| 상태 커버리지 | loading/empty/error/disabled/expand/modal/dropdown 포함 | state 분기 확인 | `src/app/tasks/page.tsx`, `src/app/activity-log/page.tsx`, `src/components/layout/header.tsx` |
| 시각 일치성 | 스크린샷 대비 레이아웃/컬러/간격/상태 표현이 동일해야 함 | screenshot 비교 | `docs/images/screenshots/*` |
