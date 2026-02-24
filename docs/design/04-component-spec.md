# 04. Component Specification

## 4.1 공통 컴포넌트 원칙
- 재사용 컴포넌트는 `src/components/ui/*`에서 정의하고, 페이지에서는 조합만 수행합니다.
- 상태 표현은 가능한 `Badge` 또는 MiniStat 계열로 통일합니다.
- 목록성 데이터는 `table + overflow-x-auto` 패턴으로 통일합니다.

## 4.2 Button
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 기본 구조 | 인라인 플렉스 정렬, 포커스 링, 비활성화 opacity | `inline-flex ... focus-visible:ring-1 ... disabled:opacity-50` | `src/components/ui/button.tsx:15` |
| Variant: default | 기본 CTA, blue 배경/white 텍스트 | `bg-blue-600 text-white hover:bg-blue-700` | `src/components/ui/button.tsx:17` |
| Variant: outline | secondary 액션, 보더 + white bg | `border border-slate-200 bg-white shadow-sm` | `src/components/ui/button.tsx:18` |
| Variant: ghost | 저강도 액션, 배경 없는 hover만 | `hover:bg-slate-100 text-slate-700` | `src/components/ui/button.tsx:19` |
| Variant: destructive | 위험 액션 | `bg-red-500 text-white hover:bg-red-600` | `src/components/ui/button.tsx:20`, `src/app/tasks/page.tsx:680-683` |
| Size: default | 높이 36px | `h-9 px-4 py-2` | `src/components/ui/button.tsx:23` |
| Size: sm | 높이 32px | `h-8 rounded-md px-3 text-xs` | `src/components/ui/button.tsx:24` |
| Size: lg/icon | large 40px, icon 36x36 | `h-10 px-8`, `h-9 w-9` | `src/components/ui/button.tsx:25-26` |

## 4.3 Card
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Card container | 반경 큰 카드 + 중립 보더 + 미세 그림자 | `rounded-xl border border-slate-200 bg-white shadow-sm` | `src/components/ui/card.tsx:5` |
| Header spacing | 카드 헤더 여백 24px | `p-6` | `src/components/ui/card.tsx:10` |
| Content spacing | 카드 본문 기본 24px, 상단 0 | `p-6 pt-0` | `src/components/ui/card.tsx:25` |
| Title/Description | 제목 semibold, 설명은 muted text | `font-semibold`, `text-sm text-slate-500` | `src/components/ui/card.tsx:15,20` |
| Footer pattern | 하단 액션 배치용 기본 row | `flex items-center p-6 pt-0` | `src/components/ui/card.tsx:30` |

## 4.4 Badge
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 기본 형태 | 작은 pill형 라벨, border + xs font | `inline-flex rounded-sm border px-2 py-0.5 text-xs` | `src/components/ui/badge.tsx:12` |
| 상태 variant 고정 | `completed/progress/pending/delayed` 4종 고정 | `bg-emerald|blue|amber|rose-100 + text-*-700` | `src/components/ui/badge.tsx:17-20` |
| 파생 variant | `default/secondary/destructive/outline` 지원 | Slate/Red 계열 | `src/components/ui/badge.tsx:14-16,21` |
| 아이콘 결합 | 상태 배지에 아이콘 + 라벨 조합 가능 | `className="gap-1"` | `src/app/tasks/page.tsx:99`, `src/app/team-members/page.tsx:57` |

## 4.5 Avatar
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 기본 크기 | 40x40 원형 | `h-10 w-10 rounded-full` | `src/components/ui/avatar.tsx:8` |
| 이미지 표시 | cover 모드 | `object-cover` | `src/components/ui/avatar.tsx:24` |
| Fallback 표시 | 초기값 텍스트, muted 배경 | `bg-slate-100 text-slate-600 font-medium` | `src/components/ui/avatar.tsx:34` |
| 헤더 프로필 적용 | 경계선 + shadow 추가 | `h-9 w-9 border border-slate-200 shadow-sm` | `src/components/layout/header.tsx:608` |

## 4.6 입력 컴포넌트 패턴
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 공통 입력 높이 | 단일 라인 입력 높이 36px | `h-9` | `src/app/search/page.tsx:171,184,196`, `src/app/tasks/page.tsx:425-499` |
| 공통 보더/반경 | 라운드 6px + slate border | `rounded-md border border-slate-200` | `src/app/login/page.tsx:67`, `src/app/settings/page.tsx:291-309` |
| Focus 규격 | blue border + ring 1px | `focus:border-blue-500 focus:ring-1 focus:ring-blue-500` | `src/app/login/page.tsx:67-78`, `src/components/layout/header.tsx:357` |
| 텍스트 입력 밀도 | 내부 좌우 패딩 12px | `px-3` | `src/app/search/page.tsx:171`, `src/app/team-members/page.tsx:248` |
| 텍스트영역 | 멀티라인 입력 최소 높이 80px | `min-h-20` | `src/app/tasks/page.tsx:446-451` |

## 4.7 테이블 패턴
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 반응형 대응 | 테이블 외곽 `overflow-x-auto` | `div.overflow-x-auto > table` | `src/app/tasks/page.tsx:616-618`, `src/app/team-members/page.tsx:275-276` |
| 헤더 스타일 | 소문자보다 가독성 높은 uppercase xs | `text-xs uppercase text-slate-500` | `src/app/team-reports/page.tsx:279-283`, `src/app/activity-log/page.tsx:208-215` |
| 행 경계 | 행 단위 얇은 구분선 | `border-b border-slate-50/100` | `src/app/projects/page.tsx:300-309`, `src/app/completed-projects/page.tsx:108-118` |
| hover 피드백 | 선택 가능 테이블은 hover 배경 표시 | `hover:bg-slate-50/80` | `src/components/dashboard/recent-activity-table.tsx:63`, `src/app/projects/page.tsx:312` |

## 4.8 MiniStat 패턴
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 구조 통일 | label(xs) + value(xl/2xl) 2단 구성 | `rounded-md border bg-slate-50 px-3 py-2` | `src/app/projects/page.tsx:540-551`, `src/app/team-reports/page.tsx:396-402`, `src/components/dashboard/project-dashboard-page.tsx:839-850` |
| 색상 확장 | 값 텍스트만 상태별 색상 변형 | `valueClassName="text-emerald-600"` 등 | `src/app/projects/page.tsx:291-294`, `src/components/dashboard/project-dashboard-page.tsx:540-543` |

## 4.9 Health / Status Meta 패턴
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Health 3단계 | `ON_TRACK/AT_RISK/CRITICAL`를 라벨+색상 매핑 | `emerald/amber/rose` 배지 | `src/components/dashboard/portfolio-dashboard-page.tsx:15-19`, `src/app/projects/page.tsx:23-33` |
| Task Status 4단계 | `COMPLETED/IN_PROGRESS/PENDING/DELAYED` 라벨/아이콘 통합 | `Badge variant + Lucide icon` | `src/app/tasks/page.tsx:69-102`, `src/app/team-members/page.tsx:38-60` |

## 4.10 차트 카드 패턴
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 카드형 차트 컨테이너 | Card 내부 높이 `280px` 차트 캔버스 | `ResponsiveContainer width="100%" height={280}` | `src/components/dashboard/weekly-combo-chart.tsx:43`, `src/components/dashboard/status-pie-chart.tsx:31` |
| 차트 툴팁 스타일 | white bg + border + rounded + soft shadow | inline `contentStyle` object | `src/components/dashboard/weekly-combo-chart.tsx:69-75`, `src/components/dashboard/status-pie-chart.tsx:49-55` |
| 대시보드 히어로 카드 | 배경 gradient + white text + 요약 capsule | `bg-gradient-to-r ... text-white` | `src/components/dashboard/portfolio-dashboard-page.tsx:66-95`, `src/components/dashboard/project-dashboard-page.tsx:504-536` |

## 4.11 Overlay 컴포넌트 패턴
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Search dropdown | 검색창 anchor, 결과/히스토리 조건 렌더 | `data-testid="header-search-dropdown"` | `src/components/layout/header.tsx:375-449` |
| Notification panel | unread 점 표시 + quick action block | `w-96`, `border`, `shadow-lg`, item 상태 배경 분기 | `src/components/layout/header.tsx:472-582` |
| Profile popover | 계정/설정/요약/바로가기 액션 | `w-[min(100vw-2rem,24rem)] p-3` | `src/components/layout/header.tsx:596-653` |

## 4.12 컴포넌트 제약사항
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 다크모드 분기 없음 | 컴포넌트는 라이트 토큰 전제 | `dark:*` class 미사용 | `src/components/ui/*.tsx` 전역 |
| 상태 enum 고정 | 상태 추가 시 Badge/Meta 동시 갱신 필요 | `statusMeta`, `healthMeta` 패턴 | `src/app/tasks/page.tsx:69-84`, `src/app/projects/page.tsx:23-27` |

