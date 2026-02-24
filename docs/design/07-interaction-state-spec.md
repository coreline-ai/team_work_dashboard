# 07. Interaction & State Specification

## 7.1 상태 체계 개요
Coreline은 상태를 아래 4개 레이어로 관리합니다.
1. 컴포넌트 상호작용 상태(hover/focus/active/disabled)
2. 데이터 상태(loading/empty/error)
3. 구조 상태(expand/collapse/tab/sort)
4. 레이어 상태(dropdown/popover/modal)

## 7.2 Interaction 상태 (UI Control)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Hover (버튼) | variant별 hover 색상 분기 | `hover:bg-blue-700`, `hover:bg-slate-100`, `hover:bg-red-600` | `src/components/ui/button.tsx:17-21` |
| Focus (입력) | border + ring으로 keyboard focus 표시 | `focus:border-blue-500 focus:ring-1 focus:ring-blue-500` | `src/app/login/page.tsx:67-78`, `src/components/layout/header.tsx:357` |
| Focus-visible (버튼) | pointer vs keyboard 구분된 링 | `focus-visible:ring-1 focus-visible:ring-slate-400` | `src/components/ui/button.tsx:15` |
| Disabled (버튼) | 클릭 차단 + 시각적 비활성화 | `disabled:pointer-events-none disabled:opacity-50` | `src/components/ui/button.tsx:15` |
| Selected (목록 버튼) | 선택된 프로젝트 카드 blue tint 표시 | `border-blue-300 bg-blue-50/50` | `src/app/projects/page.tsx:241-246` |

## 7.3 Data 상태
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Loading (page-level) | 페이지 상단/카드 내 텍스트 안내 | `text-sm text-slate-500` | `src/components/dashboard/portfolio-dashboard-page.tsx:50-52`, `src/app/completed-projects/page.tsx:103` |
| Empty (table) | `colSpan` fallback row 사용 | `td ... text-sm text-slate-500` | `src/app/team-reports/page.tsx:294-297`, `src/app/activity-log/page.tsx:297-301` |
| Empty (list/card) | 리스트 컨테이너 내 fallback 문구 | `text-sm text-slate-500` | `src/app/projects/page.tsx:238`, `src/app/search/page.tsx:281,300,316` |
| Error (form/API) | red 메시지 출력 | `text-sm text-red-600` | `src/app/login/page.tsx:82`, `src/app/search/page.tsx:250` |
| Message (성공/정보) | muted 정보 텍스트 표시 | `text-xs text-slate-500` | `src/app/settings/page.tsx:320`, `src/app/projects/page.tsx:490` |

## 7.4 Expand / Collapse / Sort / Tab 상태
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Task tree expand | 자식 task 존재 시 chevron 토글 | `ChevronDown/ChevronRight` + 작은 icon button | `src/app/tasks/page.tsx:639-647` |
| Member execution expand | 멤버별 상세 섹션 펼침 | `data-testid="team-exec-member-toggle-*"` | `src/app/team-members/page.tsx:409-415` |
| Dashboard member expand | 프로젝트 대시보드 멤버 task 펼침 | `data-testid="member-expand-*"` | `src/components/dashboard/project-dashboard-page.tsx:752-761` |
| Risk tab switch | `지연/마감임박` 탭 버튼 스타일 분기 | `variant={active ? "default" : "outline"}` | `src/app/projects/page.tsx:374-375` |
| Execution sort toggle | `마감 임박순/진행률순` 버튼 상태 분기 | `aria-pressed`, variant 전환 | `src/app/team-members/page.tsx:341-359` |
| Schedule controls | phase/member, week/month, zoom 7d/30d/all/custom | `schedule-*` testid로 제어 포인트 명시 | `src/components/dashboard/project-dashboard-page.tsx:602-677` |

## 7.5 Overlay 상태
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Search dropdown open/close | focus/typing 시 open, 외부 클릭/Escape 시 close | `searchOpen` state + 문서 이벤트 | `src/components/layout/header.tsx:153-191,375-449` |
| Notification panel | 트리거 클릭으로 토글, 외부 클릭 닫힘 | `notificationsOpen` state | `src/components/layout/header.tsx:153-191,472-582` |
| Profile popover | 트리거 클릭으로 토글, route 변경 시 닫힘 | `profileOpen` state | `src/components/layout/header.tsx:149-157,596-653` |
| Modal overlay | 프로젝트 완료 처리 모달은 full-screen dim 배경 | `fixed inset-0 ... bg-slate-900/35` | `src/app/projects/page.tsx:499-538` |
| Gantt selection overlay | 드래그 선택 영역을 반투명 블록으로 시각화 | `absolute ... bg-blue-300/70` | `src/components/dashboard/project-dashboard-page.tsx:330-347` |

## 7.6 Hover/Focus/Disabled 매트릭스
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Primary Button hover | 색상 가중치 증가 | `hover:bg-blue-700` | `src/components/ui/button.tsx:17` |
| Outline Button hover | 중립 배경 채움 | `hover:bg-slate-100` | `src/components/ui/button.tsx:18` |
| Link hover | underline 노출 | `hover:underline` | `src/components/ui/button.tsx:22` |
| Input focus | border/ring 동시 적용 | `focus:border-blue-500 focus:ring-1` | `src/app/signup/page.tsx:74-95` |
| Disabled button | 클릭 불가 + 시각 감쇠 | `disabled:pointer-events-none disabled:opacity-50` | `src/components/ui/button.tsx:15` |

## 7.7 Loading / Empty / Error 매트릭스
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Dashboard loading | 페이지 레벨 텍스트 fallback | `text-sm text-slate-500` | `src/components/dashboard/project-dashboard-page.tsx:481` |
| Tasks empty | 그룹/보드 각각 개별 fallback | `text-sm`, `border-dashed` | `src/app/tasks/page.tsx:699,741-745` |
| Search error | request 실패 메시지 | `text-sm text-red-600` | `src/app/search/page.tsx:250` |
| Activity diff empty | diff 항목 없으면 안내 row | `변경 필드 없음` | `src/app/activity-log/page.tsx:283-287` |
| Team members empty | 조건 일치 없음 메시지 | `조건에 맞는 멤버가 없습니다.` | `src/app/team-members/page.tsx:326-328` |

## 7.8 Test ID 기준 인터랙션 카탈로그
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Header search | container/dropdown/advanced 버튼 | `header-search-*` | `src/components/layout/header.tsx:318,375,447` |
| Header notification quick action | status/assignee 변경 컨트롤 | `notification-quick-*` | `src/components/layout/header.tsx:515-569` |
| Header profile | 트리거/팝오버 | `header-profile-*` | `src/components/layout/header.tsx:596,615` |
| Gantt controls | tab/scale/zoom/reset | `schedule-*`, `gantt-selection-ruler` | `src/components/dashboard/project-dashboard-page.tsx:314,602-677` |
| 팀/프로젝트 관리자 패널 | 생성/수정/완료/동의어 액션 포인트 | `team-admin-*`, `projects-admin-*`, `synonym-*` | `src/app/team-members/page.tsx:501-538`, `src/app/projects/page.tsx:405-526`, `src/app/settings/page.tsx:327-469` |

## 7.9 다크모드 상태
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 현재 미지원 | 상태 전이는 라이트 테마만 고려 | `dark:*` 유틸 미사용 | `src` 전역 `rg "dark:" src` 결과 0건 |
| 향후 확장 포인트 | 상태 컬러는 semantic token으로 전환 시 확장 용이 | `--background/--foreground` 재정의 전략 | `src/app/globals.css:3-15` |

