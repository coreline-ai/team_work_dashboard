# 02. Token Specification

## 토큰 시스템 개요
Coreline은 Tailwind v4 기본 토큰을 기반으로, 프로젝트 고유 토큰(배경/전경, 차트색, 그라디언트)을 추가해 사용합니다.

## 2.1 Foundation Token
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 루트 배경 토큰 | `--background: #f8fafc` | `bg-slate-50` 계열과 의미상 매칭 | `src/app/globals.css:4` |
| 루트 전경 토큰 | `--foreground: #0f172a` | `text-slate-900` 계열과 의미상 매칭 | `src/app/globals.css:5` |
| 테마 브리지 | `--color-background`, `--color-foreground`를 root 토큰에 연결 | `@theme inline` | `src/app/globals.css:8-10` |
| 바디 기본 스타일 | 배경/텍스트를 루트 토큰으로 고정 | `body { background/color }` | `src/app/globals.css:13-15` |

## 2.2 Semantic Color Token
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Surface/Base | 기본 앱 배경 `#f8fafc` | `bg-slate-50` | `src/app/layout.tsx:21`, `src/components/layout/sidebar.tsx:45` |
| Surface/Card | 카드 배경 `#ffffff` | `bg-white` | `src/components/ui/card.tsx:5` |
| Border/Default | 중립 보더(슬레이트 200) | `border-slate-200` | `src/components/ui/card.tsx:5`, `src/components/layout/header.tsx:314` |
| Text/Primary | 주 텍스트(슬레이트 900) | `text-slate-900` | `src/app/projects/page.tsx:223`, `src/app/team-members/page.tsx:235` |
| Text/Secondary | 보조 텍스트(슬레이트 500~700) | `text-slate-500`, `text-slate-700` | `src/app/search/page.tsx:157`, `src/app/tasks/page.tsx:649` |
| Action/Primary | CTA Blue 600, Hover Blue 700 | `bg-blue-600`, `hover:bg-blue-700` | `src/components/ui/button.tsx:17` |
| Status/Completed | 성공 상태 emerald tone | `bg-emerald-100 text-emerald-700` | `src/components/ui/badge.tsx:18` |
| Status/InProgress | 진행 상태 blue tone | `bg-blue-100 text-blue-700` | `src/components/ui/badge.tsx:17` |
| Status/Pending | 대기 상태 amber tone | `bg-amber-100 text-amber-700` | `src/components/ui/badge.tsx:20` |
| Status/Delayed | 지연 상태 rose tone | `bg-rose-100 text-rose-700` | `src/components/ui/badge.tsx:19` |
| Danger/Action | 삭제/위험 액션 red tone | `bg-red-500 hover:bg-red-600` | `src/components/ui/button.tsx:20` |

## 2.3 Tailwind Palette (OKLCH, 기준값)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Slate 50~900 | `--color-slate-50`~`--color-slate-900` (OKLCH) | `bg-slate-*`, `text-slate-*`, `border-slate-*` | `node_modules/tailwindcss/theme.css:214-223` |
| Blue 50~900 | `--color-blue-50`~`--color-blue-900` (OKLCH) | `bg-blue-*`, `text-blue-*`, `border-blue-*` | `node_modules/tailwindcss/theme.css:130-139` |
| Emerald 50~900 | `--color-emerald-50`~`--color-emerald-900` (OKLCH) | `bg-emerald-*`, `text-emerald-*` | `node_modules/tailwindcss/theme.css:82-91` |
| Amber 50~900 | `--color-amber-50`~`--color-amber-900` (OKLCH) | `bg-amber-*`, `text-amber-*` | `node_modules/tailwindcss/theme.css:34-43` |
| Rose 50~900 | `--color-rose-50`~`--color-rose-900` (OKLCH) | `bg-rose-*`, `text-rose-*` | `node_modules/tailwindcss/theme.css:202-211` |
| Red 50~900 | `--color-red-50`~`--color-red-900` (OKLCH) | `bg-red-*`, `text-red-*` | `node_modules/tailwindcss/theme.css:10-19` |

## 2.4 Hard-coded Color Token (Chart/UI)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Dashboard Status Pie | 완료 `#10b981`, 진행 `#3b82f6`, 대기 `#f59e0b`, 지연 `#ef4444` | 차트 데이터 색상 | `src/components/dashboard/project-dashboard-page.tsx:493-496` |
| Weekly Combo Bars/Line | 계획 `#93c5fd`, 완료 `#3b82f6`, 리소스 `#f59e0b` | 차트 fill/stroke | `src/components/dashboard/weekly-combo-chart.tsx:82-84` |
| Gauge Gradient | 시작 `#3b82f6`, 끝 `#10b981` | SVG gradient | `src/components/dashboard/kpi-widgets.tsx:31-32` |
| Chart Grid/Axis | 그리드 `#f1f5f9`, 축 `#64748b`, axis line `#e2e8f0` | 차트 가독성 색상 | `src/components/dashboard/weekly-combo-chart.tsx:46-62`, `src/components/dashboard/project-dashboard-page.tsx:557-559` |
| Hero Gradient (Portfolio) | `from-blue-700 via-blue-600 to-cyan-600` | `bg-gradient-to-r` | `src/components/dashboard/portfolio-dashboard-page.tsx:66` |
| Hero Gradient (Project) | `from-slate-900 via-slate-800 to-blue-800` | `bg-gradient-to-r` | `src/components/dashboard/project-dashboard-page.tsx:504` |

## 2.5 Typography Token
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 기본 폰트 | `Inter` (Google Font) | `inter.className` body 적용 | `src/app/layout.tsx:2,7,21` |
| XS 텍스트 | `--text-xs: 0.75rem` | `text-xs` | `node_modules/tailwindcss/theme.css:347-348`, `src/app/team-reports/page.tsx:170` |
| SM 텍스트 | `--text-sm: 0.875rem` | `text-sm` | `node_modules/tailwindcss/theme.css:349-350`, `src/app/tasks/page.tsx:410` |
| Base 텍스트 | `--text-base: 1rem` | `text-base` | `node_modules/tailwindcss/theme.css:351-352`, `src/components/dashboard/weekly-combo-chart.tsx:37` |
| XL/2XL/3XL | `1.25rem / 1.5rem / 1.875rem` | `text-xl`, `text-2xl`, `text-3xl` | `node_modules/tailwindcss/theme.css:355-360`, `src/components/dashboard/kpi-widgets.tsx:38,102` |
| Weight | medium `500`, semibold `600`, bold `700` | `font-medium`, `font-semibold`, `font-bold` | `node_modules/tailwindcss/theme.css:378-380`, `src/app/projects/page.tsx:249,223` |
| Tracking | tight `-0.025em`, wider `0.05em` | `tracking-tight`, `tracking-wider` | `node_modules/tailwindcss/theme.css:385,388`, `src/app/projects/page.tsx:223`, `src/components/dashboard/recent-activity-table.tsx:54-59` |

## 2.6 Spacing Token
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 기본 spacing 단위 | `--spacing: 0.25rem` | n-scale (`p-2`=0.5rem, `p-6`=1.5rem 등) | `node_modules/tailwindcss/theme.css:325` |
| 페이지 수직 리듬 | 주 섹션 간격 `gap-6` (1.5rem) | `flex flex-col gap-6` | `src/app/projects/page.tsx:221`, `src/app/team-members/page.tsx:233` |
| 카드 패딩 | 헤더/내용 기본 `p-6`, compact table card는 추가 클래스 조합 | `CardHeader p-6`, `CardContent p-6 pt-0` | `src/components/ui/card.tsx:10,25` |
| 입력 높이 규격 | 폼 요소 높이 기본 `h-9` (2.25rem) | `h-9 rounded-md border` | `src/app/search/page.tsx:171-210`, `src/app/login/page.tsx:67,78` |
| 소형 버튼 높이 | `h-8` (2rem), icon `h-9 w-9` | `size="sm"`, `size="icon"` | `src/components/ui/button.tsx:24,26` |
| 오버레이 패딩 | 드롭다운/팝오버는 `p-2~p-3` | `p-2`, `p-3` | `src/components/layout/header.tsx:485,616` |

## 2.7 Radius / Border / Shadow Token
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Radius scale | sm `0.25rem`, md `0.375rem`, lg `0.5rem`, xl `0.75rem` | `rounded-sm/md/lg/xl` | `node_modules/tailwindcss/theme.css:398-401` |
| 카드 radius | 카드 컨테이너는 `rounded-xl` 고정 | `rounded-xl` | `src/components/ui/card.tsx:5` |
| 버튼/입력 radius | 인터랙션은 `rounded-md` 기본 | `rounded-md` | `src/components/ui/button.tsx:15`, `src/app/login/page.tsx:67` |
| 보더 규격 | 1px 보더 중심 (`slate-200`, 상태별 tint) | `border border-slate-200` | `src/components/ui/card.tsx:5`, `src/app/tasks/page.tsx:533-551` |
| 그림자(기본) | 카드 `shadow-sm` 중심, overlay는 `shadow-lg` | `shadow-sm`, `shadow-lg` | `src/components/ui/card.tsx:5`, `src/components/layout/header.tsx:485,616` |
| Tailwind shadow 수치 | sm/md/lg/xl shadow values (rgb alpha) | `shadow-sm/md/lg/xl` | `node_modules/tailwindcss/theme.css:408-411` |

## 2.8 Breakpoint Token
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| `sm` | `40rem` (640px) | `sm:*` | `node_modules/tailwindcss/theme.css:327`, `src/components/dashboard/portfolio-dashboard-page.tsx:80` |
| `md` | `48rem` (768px) | `md:*` | `node_modules/tailwindcss/theme.css:328`, `src/components/layout/app-shell.tsx:24`, `src/app/search/page.tsx:168` |
| `lg` | `64rem` (1024px) | `lg:*` | `node_modules/tailwindcss/theme.css:329`, `src/components/dashboard/kpi-widgets.tsx:79` |
| `xl` | `80rem` (1280px) | `xl:*` | `node_modules/tailwindcss/theme.css:330`, `src/app/projects/page.tsx:227`, `src/components/dashboard/project-dashboard-page.tsx:546` |

## 2.9 Motion / Transition Token
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 기본 전환 | 컬러/보더 전환 중심 | `transition-colors`, `transition-all` | `src/components/ui/button.tsx:15`, `src/components/layout/header.tsx:357`, `src/app/projects/page.tsx:240` |
| 진행률 바 전환 | bar width 변경 시 부드러운 변환 | `transition-all duration-500` | `src/components/dashboard/recent-activity-table.tsx:87-90` |
| 게이지 애니메이션 | 대시보드 게이지 ring draw 애니메이션 | `transition-all duration-1000 ease-out` | `src/components/dashboard/kpi-widgets.tsx:28` |
| 즉시 피드백 | hover 배경 강조로 클릭 가능성 전달 | `hover:bg-slate-50`, `hover:bg-slate-100` | `src/components/layout/header.tsx:394-418`, `src/app/projects/page.tsx:245` |

## 2.10 Scrollbar Token
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 스크롤바 너비 | `6px` (수평/수직 동일) | 전역 pseudo selector 적용 | `src/app/globals.css:19-22` |
| 트랙 | transparent | 전역 pseudo selector 적용 | `src/app/globals.css:24-26` |
| 썸 기본 | `#cbd5e1` + radius `3px` | 전역 pseudo selector 적용 | `src/app/globals.css:28-31` |
| 썸 hover | `#94a3b8` | 전역 pseudo selector 적용 | `src/app/globals.css:33-35` |

## 2.11 다크모드 정책
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 현재 상태 | 다크모드 미지원 | `dark:*` 미사용 | `src` 전체 `rg "dark:" src` 결과 0건 |
| 확장 포인트 | `:root` 토큰을 라이트/다크로 분기 가능 | `--background/--foreground` 재정의 방식 권장 | `src/app/globals.css:3-15` |

