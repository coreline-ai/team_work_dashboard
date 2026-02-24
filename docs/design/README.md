# Coreline Design Guide Index

## 목적
이 문서는 Coreline 프런트엔드의 실제 구현을 역추적해, 다른 프로젝트에서 동일한 UI 구조/밀도/상태 표현을 재현하기 위한 디자인 가이드 인덱스입니다.

핵심 원칙:
1. 원칙 중심 설명
2. 정밀 수치(색상/타이포/간격/브레이크포인트/상태)
3. Tailwind 클래스 매핑
4. 소스 근거(`파일:라인`) 추적 가능

## 문서 맵
| 문서 | 목적 | 포함 범위 |
|---|---|---|
| `01-design-principles.md` | 디자인 철학/원칙 | 브랜드 톤, 정보 밀도, 계층, 상태 표현, 접근성 |
| `02-token-spec.md` | 토큰 사양 | 컬러, 타이포, spacing, radius, shadow, breakpoint, motion |
| `03-layout-shell-spec.md` | 공통 레이아웃 | Root/AppShell/Sidebar/Header/Auth layout |
| `04-component-spec.md` | 공통 컴포넌트 | Button/Card/Badge/Avatar/입력/테이블/MiniStat |
| `05-screen-spec-public.md` | 공개 화면 명세 | Dashboard/Tasks/Projects/Team Members/Search |
| `06-screen-spec-auth-admin.md` | 인증/관리자 명세 | Login/Signup/Settings/Completed/Activity/Reports/Admin panels |
| `07-interaction-state-spec.md` | 인터랙션/상태 | hover/focus/disabled/loading/empty/error/overlay/expand |
| `08-replication-playbook.md` | 재현 플레이북 | 구현 순서, 체크리스트, 최소 컴포넌트 세트 |
| `09-traceability-matrix.md` | 추적성 매트릭스 | 문서 항목 ↔ 코드 근거 ↔ 스크린샷 |
| `10-css-theme-unification-spec.md` | CSS 테마 통일 명세 | 이종 도메인 간 속성/테마 표준화 계약, 토큰 매핑, 전환 절차 |

## 빠른 재현 순서
1. `02-token-spec.md`로 토큰 정의
2. `10-css-theme-unification-spec.md`로 도메인 독립 테마 계약 확정
3. `03-layout-shell-spec.md`로 앱 골격 구현
4. `04-component-spec.md`로 공통 컴포넌트 구현
5. `05-screen-spec-public.md` + `06-screen-spec-auth-admin.md`로 화면 구축
6. `07-interaction-state-spec.md`로 상태/오버레이 동작 반영
7. `08-replication-playbook.md` 체크리스트로 최종 검증

## 범위 정의
### 포함
- 공개 화면, 인증 화면, 로그인 후 보호 화면
- 관리자 모드 UI 및 관리자 전용 패널
- 헤더 검색/알림/프로필 오버레이
- 프로젝트 스케줄 커스텀 선택, 확장 패널, 모달

### 제외
- 백엔드 API 설계 상세
- DB 스키마 상세
- 비주얼 외 비즈니스 로직 설명

## 라우트 커버리지
| 유형 | 경로 |
|---|---|
| Public | `/`, `/dashboard`, `/dashboard/portfolio`, `/dashboard/projects/:id`, `/tasks`, `/projects`, `/projects/:id`, `/team-members`, `/search` |
| Auth | `/login`, `/signup` |
| Protected | `/settings`, `/completed-projects`, `/activity-log`, `/team-reports` |

## 화면 자산
- 스크린샷 경로: `docs/images/screenshots/*`
- 대표 파일:
  - `dashboard-portfolio.png`
  - `dashboard-project-detail.png`
  - `tasks.png`
  - `projects.png`
  - `team-members.png`
  - `search.png`
  - `login.png`
  - `signup.png`
  - `settings.png`
  - `completed-projects.png`
  - `activity-log.png`
  - `team-reports.png`

## 공통 작성 규칙
| 규칙 | 적용 방식 | 소스 근거 |
|---|---|---|
| 원칙 + 수치 + 클래스 + 화면 | 모든 스펙 표를 4열 형식으로 통일 | `src/app/globals.css:1-34`, `src/components/ui/button.tsx:15-26` |
| 파일:라인 근거 필수 | 항목별 최소 1개 이상 참조 | `src/components/layout/header.tsx:314-616` |
| 반응형 명시 | Desktop + md + lg + xl 차이를 문서화 | `src/components/layout/app-shell.tsx:24-27`, `src/app/tasks/page.tsx:531`, `src/components/dashboard/kpi-widgets.tsx:79` |
| 다크모드 상태 명시 | 현재 미지원으로 고정, 확장 포인트만 정의 | `src` 전역 `dark:` 클래스 없음 (`rg "dark:" src` 결과 0건) |

## 용어집
| 용어 | 정의 |
|---|---|
| Public Screen | 비로그인 상태에서도 조회 가능한 화면 |
| Protected Screen | 로그인 필요 화면 |
| Admin Mode | ADMIN 권한에서 토글 가능한 운영 모드 |
| Overlay | 드롭다운/팝오버/모달 같은 레이어 UI |
| Density | 한 화면에 배치되는 정보량과 간격 밀도 |
| Token | 색상/타입/간격/반경 같은 재사용 가능한 디자인 단위 |

## 기준 소스
- 전역 스타일: `src/app/globals.css`
- 루트 레이아웃: `src/app/layout.tsx`
- Shell: `src/components/layout/app-shell.tsx`
- 네비게이션: `src/components/layout/sidebar.tsx`, `src/config/navigation.ts`
- 헤더/오버레이: `src/components/layout/header.tsx`
- UI 컴포넌트: `src/components/ui/*`
- 화면: `src/app/**/page.tsx`, `src/components/dashboard/*`
