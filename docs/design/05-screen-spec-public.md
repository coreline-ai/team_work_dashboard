# 05. Screen Specification (Public)

## 5.1 Public 화면 목록
| 화면 | 경로 | 대표 컴포넌트 | 스크린샷 |
|---|---|---|---|
| Portfolio Dashboard | `/`, `/dashboard`, `/dashboard/portfolio` | `PortfolioDashboardPage` | `docs/images/screenshots/dashboard-portfolio.png` |
| Project Dashboard (Public) | `/dashboard/projects/:id`, `/projects/:id` | `ProjectDashboardPage` | `docs/images/screenshots/dashboard-project-detail.png` |
| Tasks (비로그인) | `/tasks` | Task list/table + optional board | `docs/images/screenshots/tasks.png` |
| Projects (비로그인) | `/projects` | project list + overview/risk/timeline | `docs/images/screenshots/projects.png` |
| Team Members (공개 요약) | `/team-members` | public summary table | `docs/images/screenshots/team-members.png` |
| Search | `/search` | filter form + 3열 결과 카드 | `docs/images/screenshots/search.png` |

## 5.2 Portfolio Dashboard
### 레이아웃/섹션
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 페이지 컨테이너 | 최대 폭 7xl 중앙 정렬 + 수직 gap-6 | `w-full max-w-7xl mx-auto flex flex-col gap-6` | `src/components/dashboard/portfolio-dashboard-page.tsx:62` |
| Hero 섹션 | gradient banner + title/cta/요약 4칸 | `Card overflow-hidden border-0`, `bg-gradient-to-r ... p-6 text-white`, `sm:grid-cols-4` | `src/components/dashboard/portfolio-dashboard-page.tsx:65-95` |
| KPI 블록 | 게이지 + 4 KPI 카드 | `md:grid-cols-2 lg:grid-cols-5` | `src/components/dashboard/kpi-widgets.tsx:79-112` |
| 차트 블록 | 주간 콤보 + 상태 파이(7열 분할) | `grid gap-4 xl:grid-cols-7` (`col-span-4/3`) | `src/components/dashboard/portfolio-dashboard-page.tsx:103-106`, `src/components/dashboard/weekly-combo-chart.tsx:35`, `src/components/dashboard/status-pie-chart.tsx:24` |
| 프로젝트 헬스맵 | 카드형 링크 그리드 | `grid gap-2 md:grid-cols-2 xl:grid-cols-3` | `src/components/dashboard/portfolio-dashboard-page.tsx:112-146` |
| 최근 업데이트 표 | 테이블 기반 최근 업무 | `Card + table` | `src/components/dashboard/recent-activity-table.tsx:48-111` |

### 상태
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Loading | 텍스트 fallback | `text-sm text-slate-500` | `src/components/dashboard/portfolio-dashboard-page.tsx:50-52` |
| Error/No data | 실패 안내 텍스트 | `text-sm text-slate-500` | `src/components/dashboard/portfolio-dashboard-page.tsx:54-56` |
| Empty project map | 항목 없음 메시지 | `표시할 프로젝트가 없습니다.` | `src/components/dashboard/portfolio-dashboard-page.tsx:145` |

## 5.3 Project Dashboard (Public)
### 레이아웃/섹션
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Hero | dark gradient + health + summary chips | `bg-gradient-to-r from-slate-900 via-slate-800 to-blue-800 p-6 text-white` | `src/components/dashboard/project-dashboard-page.tsx:504-536` |
| KPI strip | 5개 MiniStat | `grid gap-3 sm:grid-cols-2 xl:grid-cols-5` | `src/components/dashboard/project-dashboard-page.tsx:538-543` |
| 차트 2단 | phase bar + status pie | `grid gap-4 xl:grid-cols-7` | `src/components/dashboard/project-dashboard-page.tsx:546-590` |
| 스케줄 간트 | 탭/스케일/줌 컨트롤 + 커스텀 선택 ruler | `data-testid="project-schedule-gantt"`, `data-testid="gantt-selection-ruler"` | `src/components/dashboard/project-dashboard-page.tsx:593-707`, `314-336` |
| 멤버 워크로드 | 확장 가능한 멤버 테이블 | `data-testid="project-member-workloads"`, expand 버튼 | `src/components/dashboard/project-dashboard-page.tsx:713-790`, `752` |
| 리스크 Top | 지연/마감임박 2열 링크 카드 | `grid gap-3 sm:grid-cols-2` | `src/components/dashboard/project-dashboard-page.tsx:795-830` |

### 상태
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Loading | 페이지 레벨 로딩 문구 | `text-sm text-slate-500` | `src/components/dashboard/project-dashboard-page.tsx:481-483` |
| Not found | 프로젝트 미존재 문구 | `text-sm text-slate-500` | `src/components/dashboard/project-dashboard-page.tsx:485-487` |
| Empty member rows | 멤버/업무 데이터 없음 메시지 | table fallback row | `src/components/dashboard/project-dashboard-page.tsx:782-788`, `144-148` |
| Empty risk | 섹션별 `항목 없음` 표시 | `text-xs text-slate-500` | `src/components/dashboard/project-dashboard-page.tsx:810,827` |

## 5.4 Tasks (비로그인)
### 레이아웃/섹션
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 헤더 | 타이틀 + 읽기전용 안내 문구 | `text-2xl`, `text-sm text-slate-500` | `src/app/tasks/page.tsx:409-412` |
| 필터/요약 카드 | 5개 상태 요약 + 필터 행 | `grid grid-cols-2 md:grid-cols-5`, `flex flex-wrap gap-2` | `src/app/tasks/page.tsx:531-551`, `554-599` |
| 프로젝트 그룹 테이블 | 프로젝트별 그룹 헤더 + task table | `rounded-lg border ...`, `overflow-x-auto table` | `src/app/tasks/page.tsx:607-688` |
| 보드(확장 GUI) | 상태 컬럼 4개 칸반 | `grid gap-3 xl:grid-cols-4` | `src/app/tasks/page.tsx:703-742` |

### 상태
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Loading | `업무를 불러오는 중...` | `text-sm text-slate-500` | `src/app/tasks/page.tsx:602-604` |
| Empty | 조회 결과 없을 때 안내 문구 | `조회된 업무가 없습니다.` | `src/app/tasks/page.tsx:699` |
| Board empty lane | 칼럼 내 항목 없음 | `border-dashed border-slate-300 ... text-slate-400` | `src/app/tasks/page.tsx:741-745` |

## 5.5 Projects (비로그인)
### 레이아웃/섹션
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 2열 메인 구조 | 좌측 목록(340px), 우측 상세 | `grid gap-4 xl:grid-cols-[340px,1fr]` | `src/app/projects/page.tsx:227` |
| 목록 카드 | 선택 상태 강조(blue tint) | selected `border-blue-300 bg-blue-50/50` | `src/app/projects/page.tsx:241-246` |
| 개요 카드 | KPI + phase table | `sm:grid-cols-2 xl:grid-cols-5` + table | `src/app/projects/page.tsx:289-332` |
| 하단 2분할 | timeline + risk 탭 | `grid gap-4 xl:grid-cols-2` | `src/app/projects/page.tsx:333-401` |

### 상태
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Loading projects | 목록 로딩 문구 | `text-sm text-slate-500` | `src/app/projects/page.tsx:237` |
| Empty projects | 목록 없음 문구 | `표시할 프로젝트가 없습니다.` | `src/app/projects/page.tsx:238` |
| Loading overview | 상세 로딩 문구 | `상세를 불러오는 중...` | `src/app/projects/page.tsx:280` |
| No overview selected | 프로젝트 선택 안내 | `프로젝트를 선택해주세요.` | `src/app/projects/page.tsx:281` |
| Empty timeline/risk | 데이터 없음 문구 | `타임라인 데이터가 없습니다.`, `리스크 항목이 없습니다.` | `src/app/projects/page.tsx:365,398` |

## 5.6 Team Members (공개 요약)
### 레이아웃/섹션
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 필터 카드 | query + project select + 고정 안내 배지 | `flex flex-wrap gap-2`, `h-9 ... min-w-64/56` | `src/app/team-members/page.tsx:240-266` |
| 공개 요약 테이블 | 이름/역할/진행중/프로젝트/대표항목 | `table w-full min-w-[760px]` | `src/app/team-members/page.tsx:268-325` |
| 헤더 줄바꿈 방지 | 핵심 컬럼 nowrap | `whitespace-nowrap` | `src/app/team-members/page.tsx:279-281,289-291` |

### 상태
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Loading | 멤버 정보 로딩 문구 | `text-sm text-slate-500` | `src/app/team-members/page.tsx:273` |
| Empty | 조건 일치 멤버 없음 문구 | `조건에 맞는 멤버가 없습니다.` | `src/app/team-members/page.tsx:326-328` |
| Empty buckets/tasks | 미배정/진행중 없음 라벨 | `text-xs text-slate-400` | `src/app/team-members/page.tsx:302-304,317-319` |

## 5.7 Search
### 레이아웃/섹션
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 필터 폼 | 5열 그리드 기반 검색 조건 | `form grid gap-3 md:grid-cols-5` | `src/app/search/page.tsx:168` |
| 결과 영역 | Task/Project/Member 3열 카드 | `grid gap-4 xl:grid-cols-3` | `src/app/search/page.tsx:260` |
| 결과 카드 | 링크형 블록 카드 | `block rounded-md border ... hover:bg-slate-50` | `src/app/search/page.tsx:265-316` |

### 상태
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Loading | 검색 중 텍스트 | `text-sm text-slate-500` | `src/app/search/page.tsx:249` |
| Error | 오류 텍스트 red | `text-sm text-red-600` | `src/app/search/page.tsx:250` |
| Meta info | 정규화/토큰/응답시간 표시 | `text-xs text-slate-500` | `src/app/search/page.tsx:251-257` |
| Empty per column | 섹션별 `결과 없음` 표시 | `text-sm text-slate-500` | `src/app/search/page.tsx:281,300,316` |

## 5.8 반응형 규칙 (Public 공통)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Desktop 기본 | 데이터 표/대시보드 중심 가독성 우선 | `max-w-7xl`, multi-grid | `src/app/tasks/page.tsx:407`, `src/components/dashboard/project-dashboard-page.tsx:546` |
| md 전환 | 폼/카드가 다열로 확장 | `md:grid-cols-*` | `src/app/search/page.tsx:168`, `src/app/tasks/page.tsx:421` |
| lg 전환 | KPI 집계 카드 확장 | `lg:grid-cols-5` | `src/components/dashboard/kpi-widgets.tsx:79` |
| xl 전환 | 복합 레이아웃(2열/7열/3열) 사용 | `xl:grid-cols-*` | `src/app/projects/page.tsx:227,333`, `src/components/dashboard/portfolio-dashboard-page.tsx:103` |

