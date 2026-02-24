# 10. CSS Theme Unification Specification

## 10.1 목적
이 문서는 **완전히 다른 도메인(예: 부동산 → 헬스케어/커머스/SaaS)**으로 전환할 때,
UI 컴포넌트 구조를 유지하면서 테마와 CSS 속성을 일관되게 교체하기 위한 표준 계약입니다.

핵심 목표:
1. 도메인별 색상/브랜드만 교체하고 컴포넌트 구조는 유지
2. 하드코딩 색상/속성 난립 방지
3. 다수 팀/프로젝트 간 동일한 속성명과 계층 유지

## 10.2 현재 코드의 기준점
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 루트 테마 토큰 | `--background`, `--foreground` 2개가 존재 | `@theme inline` 브리지 | `src/app/globals.css:3-15` |
| 라이트 테마 단일 | 현재 `dark:*` 유틸리티 미사용 | 라이트 팔레트 고정 | `src` 전역 검색(`rg "dark:" src`) 결과 0건 |
| 공통 액션 색상 | primary는 blue 600 계열 | `bg-blue-600 hover:bg-blue-700` | `src/components/ui/button.tsx:17` |
| 상태 색상 고정 | 완료/진행중/대기/지연은 emerald/blue/amber/rose | `bg-*-100 text-*-700` | `src/components/ui/badge.tsx:17-20` |

## 10.3 도메인 독립 Semantic CSS 속성 계약
다른 도메인에서도 아래 속성명은 절대 바꾸지 않습니다. 값만 교체합니다.

### 10.3.1 Foundation
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| App 배경 | `--color-surface-app` | `bg-slate-50` 대응 | `src/app/layout.tsx:21` |
| Card 배경 | `--color-surface-card` | `bg-white` 대응 | `src/components/ui/card.tsx:5` |
| Card muted 배경 | `--color-surface-muted` | `bg-slate-50`, `bg-slate-100` 대응 | `src/app/projects/page.tsx:355`, `src/components/dashboard/project-dashboard-page.tsx:347` |
| 기본 텍스트 | `--color-text-primary` | `text-slate-900` 대응 | `src/app/projects/page.tsx:223` |
| 보조 텍스트 | `--color-text-secondary` | `text-slate-500/600/700` 대응 | `src/app/search/page.tsx:157`, `src/app/tasks/page.tsx:649` |
| 기본 보더 | `--color-border-default` | `border-slate-200` 대응 | `src/components/ui/card.tsx:5` |
| 약한 보더 | `--color-border-subtle` | `border-slate-50/100` 대응 | `src/app/team-members/page.tsx:287`, `src/app/team-reports/page.tsx:276` |

### 10.3.2 Action / Focus
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Primary button bg | `--color-action-primary` | `bg-blue-600` 대응 | `src/components/ui/button.tsx:17` |
| Primary hover | `--color-action-primary-hover` | `hover:bg-blue-700` 대응 | `src/components/ui/button.tsx:17` |
| Primary text | `--color-action-on-primary` | `text-white` 대응 | `src/components/ui/button.tsx:17` |
| Focus ring | `--color-focus-ring` | `focus:ring-blue-500` 대응 | `src/app/login/page.tsx:67-78`, `src/components/layout/header.tsx:357` |
| Focus border | `--color-focus-border` | `focus:border-blue-500` 대응 | `src/app/settings/page.tsx:287-309` |

### 10.3.3 Status
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 완료 배경/텍스트 | `--color-status-completed-bg`, `--color-status-completed-fg` | `bg-emerald-100 text-emerald-700` | `src/components/ui/badge.tsx:18` |
| 진행중 배경/텍스트 | `--color-status-progress-bg`, `--color-status-progress-fg` | `bg-blue-100 text-blue-700` | `src/components/ui/badge.tsx:17` |
| 대기 배경/텍스트 | `--color-status-pending-bg`, `--color-status-pending-fg` | `bg-amber-100 text-amber-700` | `src/components/ui/badge.tsx:20` |
| 지연 배경/텍스트 | `--color-status-delayed-bg`, `--color-status-delayed-fg` | `bg-rose-100 text-rose-700` | `src/components/ui/badge.tsx:19` |
| 위험 액션 | `--color-status-danger`, `--color-status-danger-hover` | `bg-red-500 hover:bg-red-600` | `src/components/ui/button.tsx:20` |

### 10.3.4 Data-viz
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 차트 완료색 | `--color-chart-completed` (현재 `#10b981`) | chart fill | `src/components/dashboard/project-dashboard-page.tsx:493` |
| 차트 진행색 | `--color-chart-progress` (현재 `#3b82f6`) | chart fill | `src/components/dashboard/project-dashboard-page.tsx:494` |
| 차트 대기색 | `--color-chart-pending` (현재 `#f59e0b`) | chart fill | `src/components/dashboard/project-dashboard-page.tsx:495` |
| 차트 지연색 | `--color-chart-delayed` (현재 `#ef4444`) | chart fill | `src/components/dashboard/project-dashboard-page.tsx:496` |
| 차트 그리드/축 | `--color-chart-grid`, `--color-chart-axis` | chart stroke/tick | `src/components/dashboard/weekly-combo-chart.tsx:46-62` |

### 10.3.5 Elevation / Overlay
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Card shadow | `--shadow-surface` (Tailwind `shadow-sm`) | `shadow-sm` | `src/components/ui/card.tsx:5` |
| Overlay shadow | `--shadow-overlay` (Tailwind `shadow-lg`) | `shadow-lg` | `src/components/layout/header.tsx:485,616` |
| Modal backdrop | `--color-overlay-backdrop` (현재 `rgba(slate-900,0.35)`) | `bg-slate-900/35` | `src/app/projects/page.tsx:499` |

## 10.4 속성 네이밍 규칙
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Prefix 규칙 | 디자인 토큰은 `--color-*`, `--space-*`, `--radius-*`, `--shadow-*`로 통일 | 토큰-유틸 매핑 문서화 | `src/app/globals.css:3-10`, `node_modules/tailwindcss/theme.css:325,398-401,408-411` |
| 의미 우선 네이밍 | 도메인명(`realestate-blue`) 금지, 역할명(`action-primary`) 사용 | semantic naming only | `src/components/ui/button.tsx:17-22` 기준 일반화 |
| 상태 키 고정 | `completed/progress/pending/delayed/danger` 키 고정 | Badge/Status meta와 일치 | `src/components/ui/badge.tsx:17-20` |
| 단계 표현 | tone 단계는 `*-bg`, `*-fg`, `*-border`로 분리 | 컬러 조합 재사용성 확보 | `src/app/tasks/page.tsx:533-551` |

## 10.5 Tailwind 매핑 전략
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 1차 단계 | 기존 Tailwind 클래스 유지 + semantic 문서만 우선 도입 | `bg-slate-*`, `text-slate-*` 유지 | 현재 전 코드 |
| 2차 단계 | `globals.css`에 semantic custom property 확장 | `:root { --color-* }` | `src/app/globals.css` 확장 방식 |
| 3차 단계 | 컴포넌트에 semantic alias class 도입(점진) | 예: `.ui-surface-card { background: var(--color-surface-card) }` | `src/components/ui/*` 점진 변경 |
| 4차 단계 | 차트 색상 하드코딩 제거 | chart config를 custom property 기반으로 전환 | `src/components/dashboard/*` |

## 10.6 Cross-domain 테마 매핑 템플릿
아래 표로 도메인별 팔레트를 의미 토큰에 매핑합니다.

| Semantic Token | Coreline(Default) | Domain A 예시(Healthcare) | Domain B 예시(E-commerce) | 적용 컴포넌트 |
|---|---|---|---|---|
| `--color-action-primary` | blue-600 계열 | teal-600 계열 | violet-600 계열 | Button default, active tab |
| `--color-status-completed-bg/fg` | emerald-100/700 | mint-100/700 | lime-100/700 | Badge completed |
| `--color-status-delayed-bg/fg` | rose-100/700 | red-100/700 | orange-red-100/700 | Badge delayed, risk labels |
| `--color-surface-app` | slate-50 | neutral-50 | warm-gray-50 | body/app shell |
| `--color-border-default` | slate-200 | neutral-200 | stone-200 | card/input/table border |

## 10.7 테마 스코프 전략
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 글로벌 스코프 | 기본은 `:root`에서 default theme 제공 | global custom properties | `src/app/globals.css:3-15` |
| 도메인 스코프 | 페이지/앱 래퍼에 `data-domain-theme` 부여해 override | `[data-domain-theme="health"] { --color-* }` | AppShell 래핑 적용 가능 (`src/components/layout/app-shell.tsx:10-29`) |
| 조직/브랜드 스코프 | 화이트라벨 시 `data-brand` 병행 가능 | `[data-brand="acme"]` | 프로젝트별 배포 구성에서 주입 |

## 10.8 CSS 속성 통일 체크리스트
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 하드코딩 색상 탐지 | `#hex` 직접 사용을 정기 점검 | `rg -n "#[0-9a-fA-F]{3,8}"` | 차트/gradient 파일(`src/components/dashboard/*`) |
| 상태 색상 일관성 | badge/status/summary 숫자 색상 동기화 | `blue/emerald/amber/rose` 체계 | `src/components/ui/badge.tsx`, `src/app/tasks/page.tsx:533-551` |
| 인터랙션 포커스 일관성 | 입력/검색/설정 폼 focus 스타일 통일 | `focus:border-blue-500 focus:ring-1` | `src/app/login/page.tsx:67-78`, `src/components/layout/header.tsx:357` |
| 오버레이 레이어 일관성 | dropdown/popover/modal의 보더/그림자/z-index 통일 | `border-slate-200 shadow-lg z-30` | `src/components/layout/header.tsx:375-616`, `src/app/projects/page.tsx:499-538` |
| 반응형 밀도 유지 | md/lg/xl 전환 시 spacing/grid 밀도 유지 | `md:*`, `lg:*`, `xl:*` | `src/app/projects/page.tsx:227,333`, `src/components/dashboard/kpi-widgets.tsx:79` |

## 10.9 권장 구현 스니펫
```css
/* docs/spec only: semantic contract sample */
:root {
  --color-surface-app: #f8fafc;
  --color-surface-card: #ffffff;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-border-default: #e2e8f0;

  --color-action-primary: #2563eb;
  --color-action-primary-hover: #1d4ed8;
  --color-action-on-primary: #ffffff;

  --color-status-completed-bg: #dcfce7;
  --color-status-completed-fg: #047857;
  --color-status-progress-bg: #dbeafe;
  --color-status-progress-fg: #1d4ed8;
  --color-status-pending-bg: #fef3c7;
  --color-status-pending-fg: #b45309;
  --color-status-delayed-bg: #ffe4e6;
  --color-status-delayed-fg: #be123c;
}

[data-domain-theme="healthcare"] {
  --color-action-primary: #0f766e;
  --color-action-primary-hover: #115e59;
}
```

## 10.10 적용 순서 (도메인 전환 프로젝트용)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 1단계: 역할 토큰 고정 | semantic token 목록 확정(본 문서 10.3) | token contract freeze | 본 문서 |
| 2단계: 도메인 팔레트 매핑 | 새 도메인 브랜드를 semantic token에 매핑 | mapping table 작성 | 본 문서 10.6 |
| 3단계: 샘플 페이지 검증 | `/dashboard/portfolio`, `/tasks`, `/projects`로 시각 검증 | 레이아웃/상태 유지 확인 | `src/components/dashboard/portfolio-dashboard-page.tsx`, `src/app/tasks/page.tsx`, `src/app/projects/page.tsx` |
| 4단계: 오버레이 검증 | 검색/알림/프로필, 완료 모달 확인 | contrast + elevation 검증 | `src/components/layout/header.tsx`, `src/app/projects/page.tsx:499-538` |
| 5단계: 상태 회귀 검증 | completed/progress/pending/delayed 인지성 확인 | badge/summary/table 색상 점검 | `src/components/ui/badge.tsx`, `src/app/tasks/page.tsx` |

