# 09. Traceability Matrix

## 목적
디자인 가이드의 각 항목이 실제 구현 코드와 화면 자산에 추적 가능하도록 매핑합니다.

## 9.1 토큰/기반 매핑
| 문서 항목 | 소스 파일:라인 | 스크린샷 | 비고 |
|---|---|---|---|
| Root background/foreground token | `src/app/globals.css:4-5` | 전체 공통 | `#f8fafc`, `#0f172a` |
| Theme inline bridge | `src/app/globals.css:8-10` | 전체 공통 | semantic token 연결 |
| Scrollbar style | `src/app/globals.css:19-35` | 긴 테이블 화면 | 공통 스크롤 UX |
| Body/Inter font | `src/app/layout.tsx:7,21` | 전체 공통 | Inter + h-screen shell |
| Tailwind spacing scale | `node_modules/tailwindcss/theme.css:325` | 전체 공통 | `--spacing: 0.25rem` |
| Tailwind breakpoints | `node_modules/tailwindcss/theme.css:327-330` | 반응형 모든 화면 | sm/md/lg/xl 기준 |
| Tailwind text scale | `node_modules/tailwindcss/theme.css:347-360` | 모든 텍스트 | xs~3xl |
| Tailwind radius/shadow | `node_modules/tailwindcss/theme.css:398-401,408-411` | 카드/오버레이 | round/shadow 규격 |

## 9.2 Layout Shell 매핑
| 문서 항목 | 소스 파일:라인 | 스크린샷 | 비고 |
|---|---|---|---|
| AppShell auth split | `src/components/layout/app-shell.tsx:8-18` | `login.png`, `signup.png` | 인증 화면 중앙 정렬 |
| AppShell main split | `src/components/layout/app-shell.tsx:24-27` | 대시보드/작업/프로젝트 | Sidebar + Header + Main |
| Sidebar width/visibility | `src/components/layout/app-shell.tsx:24` | 데스크톱 전 화면 | `w-64`, `hidden md:flex` |
| Sidebar visual style | `src/components/layout/sidebar.tsx:45-88` | 모든 app 화면 | bg/border/nav states |
| Header base layout | `src/components/layout/header.tsx:314` | 모든 app 화면 | `h-16`, `border-b` |
| Header search overlay | `src/components/layout/header.tsx:318-449` | 다수 화면 | dropdown behavior |
| Header notification overlay | `src/components/layout/header.tsx:472-582` | 로그인 상태 화면 | unread/quick action |
| Header profile popover | `src/components/layout/header.tsx:596-653` | 로그인 상태 화면 | account/settings summary |

## 9.3 UI Component 매핑
| 문서 항목 | 소스 파일:라인 | 스크린샷 | 비고 |
|---|---|---|---|
| Button variants/sizes | `src/components/ui/button.tsx:4-29` | 전 화면 공통 | default/outline/ghost/destructive/link |
| Card primitives | `src/components/ui/card.tsx:4-34` | 카드 기반 모든 화면 | header/content/footer spacing |
| Badge variants | `src/components/ui/badge.tsx:4-29` | tasks/projects/dashboard | status coloring |
| Avatar component | `src/components/ui/avatar.tsx:5-40` | header/recent activity | fallback initials |
| StatusBadge (Tasks) | `src/app/tasks/page.tsx:95-102` | `tasks.png` | icon + badge |
| HealthBadge (Projects) | `src/app/projects/page.tsx:23-33` | `projects.png` | ON_TRACK/AT_RISK/CRITICAL |
| HealthBadge (Dashboard) | `src/components/dashboard/portfolio-dashboard-page.tsx:15-22` | `dashboard-portfolio.png` | 동일 meta 사용 |
| MiniStat patterns | `src/app/projects/page.tsx:540-551`, `src/app/team-reports/page.tsx:396-402`, `src/components/dashboard/project-dashboard-page.tsx:839-850` | 다수 화면 | KPI strip 일관성 |

## 9.4 Public Screen 매핑
| 문서 항목 | 소스 파일:라인 | 스크린샷 | 비고 |
|---|---|---|---|
| Portfolio Dashboard hero | `src/components/dashboard/portfolio-dashboard-page.tsx:66-95` | `dashboard-portfolio.png` | blue-cyan gradient hero |
| Portfolio KPI/charts | `src/components/dashboard/kpi-widgets.tsx:79-112`, `src/components/dashboard/weekly-combo-chart.tsx:35-85`, `src/components/dashboard/status-pie-chart.tsx:24-61` | `dashboard-portfolio.png` | 5-card + 2 charts |
| Portfolio health map | `src/components/dashboard/portfolio-dashboard-page.tsx:109-146` | `dashboard-portfolio.png` | project card grid |
| Project Dashboard core | `src/components/dashboard/project-dashboard-page.tsx:504-830` | `dashboard-project-detail.png` | hero/kpi/chart/gantt/member/risk |
| Tasks public table/board | `src/app/tasks/page.tsx:531-742` | `tasks.png` | summary + grouped tables + board |
| Projects public split layout | `src/app/projects/page.tsx:227-401` | `projects.png` | list/detail/risk/timeline |
| Team Members public summary | `src/app/team-members/page.tsx:268-329` | `team-members.png` | 5-column public table |
| Search filters/results | `src/app/search/page.tsx:168-316` | `search.png` | 5-col filter + 3-col results |

## 9.5 Auth & Protected Screen 매핑
| 문서 항목 | 소스 파일:라인 | 스크린샷 | 비고 |
|---|---|---|---|
| Login form | `src/app/login/page.tsx:48-91` | `login.png` | email/password/auth CTA |
| Signup form | `src/app/signup/page.tsx:55-107` | `signup.png` | name/email/password |
| Settings personal | `src/app/settings/page.tsx:261-320` | `settings.png` | user preferences |
| Settings synonym admin | `src/app/settings/page.tsx:327-470` | `settings.png` | admin-only dictionary |
| Completed projects | `src/app/completed-projects/page.tsx:76-184` | `completed-projects.png` | KPI + list + history |
| Activity log | `src/app/activity-log/page.tsx:111-324` | `activity-log.png` | filter + diff + pagination |
| Team reports | `src/app/team-reports/page.tsx:173-402` | `team-reports.png` | filter + SLA + snapshots |

## 9.6 Admin-only 매핑
| 문서 항목 | 소스 파일:라인 | 스크린샷 | 비고 |
|---|---|---|---|
| Projects admin panel | `src/app/projects/page.tsx:405-538` | `projects.png` | create/update/complete modal |
| Team members admin create/manage | `src/app/team-members/page.tsx:501-609` | `team-members.png` | create, role/status management |
| Header admin mode toggle | `src/components/layout/header.tsx:456-467` | 로그인 화면군 | admin ON/OFF |
| Header notification quick actions | `src/components/layout/header.tsx:515-571` | 로그인 화면군 | change status/assignee |

## 9.7 Interaction/Test ID 매핑
| 문서 항목 | 소스 파일:라인 | 스크린샷 | 비고 |
|---|---|---|---|
| Header search test IDs | `src/components/layout/header.tsx:318,375,447` | 공통 | `header-search-*` |
| Header profile/notification IDs | `src/components/layout/header.tsx:472,596,615` | 공통 | overlay 검증 포인트 |
| Gantt control IDs | `src/components/dashboard/project-dashboard-page.tsx:314,593,602-677` | `dashboard-project-detail.png` | gantt 상호작용 검증 |
| Team execution IDs | `src/app/team-members/page.tsx:335,341,351,409` | `team-members.png` | sort/toggle 동작 |
| Projects admin IDs | `src/app/projects/page.tsx:405,420,432,478,507,526` | `projects.png` | 운영 액션 테스트 |
| Settings synonym IDs | `src/app/settings/page.tsx:327,426,468,469` | `settings.png` | CRUD 테스트 포인트 |
| Team reports IDs | `src/app/team-reports/page.tsx:173,236,244` | `team-reports.png` | snapshot/export |
| Activity diff ID | `src/app/activity-log/page.tsx:257` | `activity-log.png` | diff table 영역 |
| Auth IDs | `src/app/login/page.tsx:53,62,73,83`, `src/app/signup/page.tsx:60` | `login.png`, `signup.png` | 인증 플로우 |

## 9.8 누락/갭 점검
| 문서 항목 | 소스 파일:라인 | 스크린샷 | 비고 |
|---|---|---|---|
| 다크모드 클래스 사용 | `src` 전체 검색 결과 없음 | 해당 없음 | `rg "dark:" src` = 0건 |
| 디자인 토큰 단일 소스 | `globals.css` + `tailwind theme.css` | 전체 공통 | 완전한 독립 DS 파일은 아직 없음 |
| 오버레이 스크린샷 | 개별 overlay 캡처 파일 없음 | 없음 | 문서에서 상태 표로 보완 |

