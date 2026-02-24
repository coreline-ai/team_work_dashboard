# 03. Layout & Shell Specification

## 3.1 Shell 구조
Coreline은 `RootLayout` + `AppShell` 구조로, 인증 화면과 일반 운영 화면 레이아웃을 분리합니다.

### 구조 다이어그램
```text
html/body (h-screen, overflow-hidden)
└─ AuthSessionProvider
   └─ AppShell
      ├─ Auth Route(/login,/signup): Centered Main
      └─ App Route: Sidebar + Header + Scrollable Main
```

## 3.2 Root Layout 규격
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 전체 높이 고정 | viewport 기준 `h-screen`, body overflow 차단 | `flex h-screen overflow-hidden` | `src/app/layout.tsx:21` |
| 기본 배경/텍스트 | 라이트 배경 + 고대비 텍스트 | `bg-slate-50 text-slate-900` | `src/app/layout.tsx:21` |
| 글로벌 폰트 | Inter를 앱 전체 공통 적용 | `inter.className` body 적용 | `src/app/layout.tsx:7,21` |

## 3.3 AppShell 분기 규격
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 인증 경로 분리 | `/login`, `/signup`은 중앙 정렬 단일 main 사용 | `min-h-screen items-center justify-center p-6` | `src/components/layout/app-shell.tsx:8,16` |
| 일반 경로 기본 구조 | 좌측 Sidebar + 우측 Header/Main 2열 구조 | `Sidebar + div.flex-1.flex-col` | `src/components/layout/app-shell.tsx:24-27` |
| 메인 스크롤 영역 | 콘텐츠 영역만 Y-scroll 허용 | `main flex-1 overflow-y-auto` | `src/components/layout/app-shell.tsx:27` |
| 반응형 패딩 | main padding `p-4 / md:p-6 / lg:p-8` | `p-4 md:p-6 lg:p-8` | `src/components/layout/app-shell.tsx:27` |

## 3.4 Sidebar 규격
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 표시 조건 | `md` 이상에서만 표시, 모바일 숨김 | `hidden md:flex` | `src/components/layout/app-shell.tsx:24` |
| 폭 규격 | 고정 폭 `w-64` (16rem) | `w-64 shrink-0` | `src/components/layout/app-shell.tsx:24` |
| 배경/경계 | 중립 배경 + 우측 보더 | `bg-slate-50 border-r border-slate-200` | `src/components/layout/sidebar.tsx:45` |
| 브랜드 바 | 상단 높이 `h-16`, 좌우 `px-6` | `h-16 px-6 border-b` | `src/components/layout/sidebar.tsx:46-50` |
| 메뉴 상태 표현 | Active: 흰 배경+보더+그림자, Inactive: 텍스트 중심 | `bg-white border shadow-sm` vs `hover:bg-slate-200/50` | `src/components/layout/sidebar.tsx:27-32` |
| 아이콘 컬러 상태 | Active는 blue, 기본은 slate | `text-blue-600` vs `text-slate-500` | `src/components/layout/sidebar.tsx:57,68,80` |
| 관리자 섹션 | Admin mode 켜진 상태에서만 하단 구획 노출 | `visibleAdmin` 조건 렌더링 | `src/components/layout/sidebar.tsx:42,73-86`, `src/config/navigation.ts:26-27` |

## 3.5 Header 규격
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 고정 헤더 높이 | 높이 `h-16`, 상단 고정 레이어 성격 | `h-16 shrink-0 z-10` | `src/components/layout/header.tsx:314` |
| 헤더 배경/경계 | white background + 하단 border | `bg-white border-b border-slate-200` | `src/components/layout/header.tsx:314` |
| 헤더 좌우 패딩 | `px-6` | `px-6` | `src/components/layout/header.tsx:314` |
| 검색 영역 폭 | 최대 `max-w-2xl`, `md` 미만 숨김 | `w-full max-w-2xl hidden md:flex` | `src/components/layout/header.tsx:321` |
| 검색 입력 규격 | 높이 `h-9`, 좌측 아이콘 공간 `pl-9`, focus ring | `h-9 pl-9 pr-4 ... focus:ring-1` | `src/components/layout/header.tsx:357` |

## 3.6 Overlay Layout 규격 (Header)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Search Dropdown | 상단 `top-11`, 최대폭 `min(100%,42rem)` | `absolute top-11 left-0 w-[min(100%,42rem)]` | `src/components/layout/header.tsx:375` |
| Notification Panel | 벨 아이콘 아래 `top-8`, 폭 `w-96` | `absolute right-0 top-8 w-96` | `src/components/layout/header.tsx:485` |
| Profile Popover | 프로필 버튼 아래 `top-12`, 가변폭 `min(100vw-2rem,24rem)` | `absolute right-0 top-12 w-[min(100vw-2rem,24rem)]` | `src/components/layout/header.tsx:615-616` |
| Overlay 공통 스타일 | white + border + shadow + z-index 30 | `rounded-md border bg-white shadow-lg z-30` | `src/components/layout/header.tsx:375,485,616` |

## 3.7 콘텐츠 컨테이너 규격
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 기본 페이지 너비 | 대부분 `max-w-7xl`, 중앙 정렬 | `w-full max-w-7xl mx-auto` | `src/app/tasks/page.tsx:407`, `src/app/projects/page.tsx:221`, `src/app/team-reports/page.tsx:173` |
| 설정 페이지 너비 | 상대적으로 좁은 편집형 레이아웃 | `max-w-5xl` | `src/app/settings/page.tsx:261` |
| 인증 페이지 너비 | 단일 카드 중심 | `w-full max-w-md` | `src/app/login/page.tsx:48`, `src/app/signup/page.tsx:55` |

## 3.8 반응형 레이아웃 포인트
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Sidebar 등장 시점 | `md >= 48rem`에서 좌측 네비 표시 | `hidden md:flex` | `src/components/layout/app-shell.tsx:24`, `node_modules/tailwindcss/theme.css:328` |
| KPI 카드 확장 | 카드 수 증가에 따라 md/lg grid 확장 | `md:grid-cols-2 lg:grid-cols-5` | `src/components/dashboard/kpi-widgets.tsx:79` |
| 대시보드 섹션 분할 | 큰 화면에서 7열/2열 등 복합 grid | `xl:grid-cols-7`, `xl:grid-cols-2` | `src/components/dashboard/project-dashboard-page.tsx:546`, `src/app/team-reports/page.tsx:265` |
| 프로젝트 리스트+상세 2분할 | `xl` 이상에서 `340px + 1fr` split | `xl:grid-cols-[340px,1fr]` | `src/app/projects/page.tsx:227` |

## 3.9 Auth Layout 규격
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 중앙 배치 | 인증 화면은 전체 화면 중앙에 카드 배치 | `items-center justify-center` | `src/components/layout/app-shell.tsx:16` |
| 카드 단일 컬럼 | 입력 요소 세로 스택 + `space-y-4` | `form className="space-y-4"` | `src/app/login/page.tsx:58`, `src/app/signup/page.tsx:65` |
| 탑바 보조 액션 | 좌측 타이틀 + 우측 홈 버튼 | `flex items-center justify-between` | `src/app/login/page.tsx:50-54`, `src/app/signup/page.tsx:57-61` |

