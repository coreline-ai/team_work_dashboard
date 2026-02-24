# 01. Design Principles

## 원칙 개요
Coreline UI는 "운영 대시보드" 성격을 우선하며, 감성적 표현보다 **판독성, 상태 인지, 조작 일관성**을 우선합니다.

## 원칙 매트릭스
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 브랜드 톤: Neutral Slate + Action Blue | 기본 배경 `#f8fafc`, 기본 전경 `#0f172a`, 주요 액션 Blue 600/700 계열 사용 | `bg-slate-50`, `text-slate-900`, `bg-blue-600`, `hover:bg-blue-700` | `src/app/globals.css:4-15`, `src/components/ui/button.tsx:17` |
| 정보 밀도: 카드 기반 중밀도 레이아웃 | 페이지 간격 기본 `gap-6`, 카드 내부 `p-6`, 카드 간 `gap-4` | `flex flex-col gap-6`, `CardContent p-6`, `grid gap-4` | `src/app/tasks/page.tsx:407`, `src/components/ui/card.tsx:10,25`, `src/components/dashboard/portfolio-dashboard-page.tsx:103` |
| 계층 구조: H1 > 섹션타이틀 > 본문 > 보조 텍스트 | H1은 `text-2xl + font-bold`, 섹션은 `text-base + font-semibold`, 보조 정보는 `text-sm/text-xs` | `text-2xl font-bold`, `text-base font-semibold`, `text-sm text-slate-500`, `text-xs` | `src/app/projects/page.tsx:223,267`, `src/app/team-members/page.tsx:235,270`, `src/components/dashboard/recent-activity-table.tsx:55-60` |
| 상태 표현: 색상 + 라벨 + 아이콘 복합 표현 | 상태 4종(완료/진행중/대기/지연) 고정, 배지는 파스텔 배경 + 진한 텍스트 | `Badge` variants: `completed/progress/pending/delayed` | `src/components/ui/badge.tsx:17-20`, `src/app/tasks/page.tsx:69-102`, `src/app/team-members/page.tsx:38-60` |
| 운영 리스크 가시성 우선 | 지연/마감임박은 rose/amber 색상으로 즉시 구분 | `text-rose-*`, `bg-rose-*`, `text-amber-*`, `bg-amber-*` | `src/app/projects/page.tsx:250-255,374-375`, `src/components/dashboard/project-dashboard-page.tsx:64-67,796-829` |
| 인터랙션 우선순위: 표/필터/드릴다운 | 목록→필터→상세 액션 순으로 배치, 대부분 테이블 중심 | `overflow-x-auto`, `table w-full text-sm`, `h-9 rounded-md border` | `src/app/tasks/page.tsx:607-688`, `src/app/activity-log/page.tsx:130-239`, `src/app/team-reports/page.tsx:274-395` |
| 관리자 제어 분리 | 관리자 기능은 카드/섹션으로 분리하고 `data-testid` 명시 | `data-testid="*-admin-*"`, `Card` 분리 섹션 | `src/app/projects/page.tsx:405-538`, `src/app/team-members/page.tsx:501-609`, `src/app/settings/page.tsx:327-470` |
| 라이트 테마 고정 | 다크 모드 유틸 미사용, 라이트 토큰 중심 설계 | `bg-white`, `bg-slate-50`, `text-slate-*` 중심 | `src` 전체 `dark:` 클래스 없음, `src/app/globals.css:4-15` |
| 오버레이는 높은 대비 + 경계선 + 그림자 | Dropdown/Popover/Panel은 `border + bg-white + shadow-lg + z-30` | `rounded-md border border-slate-200 bg-white shadow-lg z-30` | `src/components/layout/header.tsx:375-616` |

## 디자인 의사결정 규칙
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 액션 버튼 계층 | 1차 액션은 `default`, 보조는 `outline`, 위험 액션은 `destructive` | `Button variant="default|outline|destructive"` | `src/components/ui/button.tsx:17-22`, `src/app/tasks/page.tsx:676-683` |
| 읽기 전용 vs 편집 가능 구분 | 비로그인/권한 부족 시 액션 버튼 제거 또는 안내 텍스트 노출 | `조회 전용`, 조건부 렌더링 | `src/app/completed-projects/page.tsx:129-147`, `src/app/tasks/page.tsx:411-418` |
| 성능보다 명확성 우선(표시) | 상태 카운터/요약 수치 상시 노출 | `MiniStat` 카드 반복 패턴 | `src/app/projects/page.tsx:289-294`, `src/app/team-reports/page.tsx:257-262`, `src/app/team-members/page.tsx:364-367` |
| 확장 UI는 점진적 공개 | 기본 표 중심, 보드는 토글로 노출 | `확장 GUI 보기/숨기기` 토글 | `src/app/tasks/page.tsx:513-527,703-742` |

## 접근성 원칙
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 포커스 가시성 유지 | 입력/버튼 포커스 시 1px ring + blue border | `focus:ring-1 focus:ring-blue-500 focus:border-blue-500` | `src/components/layout/header.tsx:357`, `src/app/login/page.tsx:67,78` |
| 클릭 타깃 최소 높이 | 주요 입력/버튼 높이 `h-9` 통일 | `h-9` | `src/components/ui/button.tsx:23`, `src/app/search/page.tsx:171,184,196` |
| 텍스트 대비 확보 | 본문 `slate-700~900`, 보조 `slate-500`, 상태색은 배경 대비 조합 | `text-slate-900`, `text-slate-700`, `bg-*-100 + text-*-700` | `src/components/ui/badge.tsx:17-20`, `src/app/projects/page.tsx:249-255` |
| 보조 장치 대응용 식별자 | 주요 인터랙션에 `data-testid` 부여 | `data-testid` 키 체계 | `src/components/layout/header.tsx:318-615`, `src/components/dashboard/project-dashboard-page.tsx:593-677` |

## 비목표(Non-goals)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 브랜드 실험형 비주얼 | 고채도/장식형 그래픽/복잡 애니메이션 미채택 | 최소 애니메이션(`transition-colors`, `transition-all`) | `src/components/ui/button.tsx:15`, `src/components/dashboard/recent-activity-table.tsx:63` |
| 다크 모드 동시 설계 | 현재 버전은 라이트 단일 테마 | 미구현 상태 유지 | `src/app/globals.css:4-15`, `src` 전역 `dark:` 미사용 |

