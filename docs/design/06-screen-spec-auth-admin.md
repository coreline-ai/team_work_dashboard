# 06. Screen Specification (Auth & Admin)

## 6.1 Auth 화면

### Login (`/login`)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 인증 카드 폭 | 최대 `max-w-md` 단일 카드 | `Card className="w-full max-w-md"` | `src/app/login/page.tsx:48` |
| 헤더 구조 | 타이틀 + 홈 이동 보조 버튼 | `flex items-center justify-between gap-2` | `src/app/login/page.tsx:50-54` |
| 입력 구조 | 이메일/비밀번호 2필드 + 제출 버튼 | `label.flex.flex-col.gap-1.5`, `h-9` | `src/app/login/page.tsx:59-83` |
| 오류 노출 | 로그인 실패 시 red 텍스트 노출 | `text-sm text-red-600` | `src/app/login/page.tsx:82` |
| CTA | full width 버튼 | `Button className="w-full"` | `src/app/login/page.tsx:83` |

### Signup (`/signup`)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 인증 카드 폭 | 로그인과 동일한 폭 규격 | `w-full max-w-md` | `src/app/signup/page.tsx:55` |
| 입력 필드 | 이름/이메일/비밀번호 3필드 | `space-y-4`, `h-9` | `src/app/signup/page.tsx:65-99` |
| 오류 노출 | 가입 실패 시 red 텍스트 노출 | `text-sm text-red-600` | `src/app/signup/page.tsx:98` |
| 전환 링크 | 로그인/회원가입 상호 이동 링크 제공 | `text-blue-600 hover:underline` | `src/app/signup/page.tsx:103-104`, `src/app/login/page.tsx:87-88` |

## 6.2 Protected 화면

### Settings (`/settings`)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 컨테이너 폭 | 편집 중심의 좁은 레이아웃 | `max-w-5xl` | `src/app/settings/page.tsx:261` |
| 개인 설정 카드 | 토글 + select + input + 저장 | `space-y-5`, `h-9`, `focus:ring-1` | `src/app/settings/page.tsx:269-320` |
| 관리자 동의어 카드 | 관리자 모드에서만 고급 패널 노출 | `data-testid="project-synonyms-admin-panel"` | `src/app/settings/page.tsx:327-470` |
| 동의어 편집 2열 | 추가/수정 패널 양분 | `grid gap-4 lg:grid-cols-2` | `src/app/settings/page.tsx:391` |

### Completed Projects (`/completed-projects`)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 상단 KPI 2카드 | 전체 완료 / 최근30일 완료 | `grid gap-3 sm:grid-cols-2` | `src/app/completed-projects/page.tsx:87-96` |
| 완료 목록 테이블 | 완료일/완료자/노트/진행률/관리 | `table w-full text-sm` | `src/app/completed-projects/page.tsx:106-152` |
| 이력 섹션 | 프로젝트별 timeline-like history block | `rounded-md border p-3` | `src/app/completed-projects/page.tsx:167-181` |
| 관리자 액션 | 재개 버튼은 admin mode에서만 노출 | 조건부 `showAdminActions` | `src/app/completed-projects/page.tsx:129-147` |

### Activity Log (`/activity-log`)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 필터 폼 | 6열 기반 필터 그리드 | `form grid gap-2 md:grid-cols-6` | `src/app/activity-log/page.tsx:130` |
| 로그 테이블 | 시간/Actor/Action/Entity/링크/상세 | `table w-full text-sm` | `src/app/activity-log/page.tsx:205-237` |
| 확장 상세 | Before/After JSON + Diff 테이블 | `grid gap-3 md:grid-cols-2`, `data-testid="activity-diff-table"` | `src/app/activity-log/page.tsx:240-295`, `257` |
| 페이지네이션 | 이전/다음 버튼 + 총건수 표시 | `flex items-center justify-between` | `src/app/activity-log/page.tsx:303-324` |

### Team Reports (`/team-reports`)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 필터 행 | 주차/멤버/프로젝트 + 조회/모드버튼 | `CardContent flex flex-wrap gap-2` | `src/app/team-reports/page.tsx:181-252` |
| KPI strip | SLA 중심 5개 MiniStat | `grid gap-3 sm:grid-cols-5` | `src/app/team-reports/page.tsx:257-262` |
| 지표 2분할 | 멤버/프로젝트 지표 테이블 2열 | `grid gap-4 xl:grid-cols-2` | `src/app/team-reports/page.tsx:265-347` |
| 스냅샷 히스토리 | 로드 버튼 포함 히스토리 테이블 | `table w-full text-sm` | `src/app/team-reports/page.tsx:353-392` |
| 관리자 기능 | 스냅샷 생성/CSV 내보내기 버튼 | `data-testid="team-reports-create-snapshot/export-csv"` | `src/app/team-reports/page.tsx:236-250` |

## 6.3 Admin-only 패널

### Projects Admin Panel (`/projects`, admin mode)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 관리자 패널 루트 | 별도 카드로 생성/수정/완료 분리 | `data-testid="projects-admin-panel"` | `src/app/projects/page.tsx:405` |
| 생성 폼 | 이름/설명/생성 버튼 | `grid gap-2 md:grid-cols-3` | `src/app/projects/page.tsx:418-433` |
| 수정 폼 | 프로젝트 선택 + name/desc/archive + 저장 | `grid gap-2 md:grid-cols-4` | `src/app/projects/page.tsx:441-477` |
| 완료 모달 | 고정 오버레이 + 중앙 패널 + textarea | `fixed inset-0 ...`, `max-w-lg`, `shadow-xl` | `src/app/projects/page.tsx:499-538` |

### Team Members Admin Panel (`/team-members`, admin mode)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 생성 패널 | 이름/이메일/비밀번호/역할/생성 | `data-testid="team-admin-create-panel"`, `grid md:grid-cols-5` | `src/app/team-members/page.tsx:501-535` |
| 관리 패널 | 상태 필터 + 사용자 테이블 + 활성/비활성 액션 | `data-testid="team-admin-manage-panel"`, `overflow-x-auto table` | `src/app/team-members/page.tsx:538-609` |

### Settings Synonym Panel (`/settings`, admin mode)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 동의어 목록 필터 | 전체/전역/프로젝트 스코프 필터 | `grid gap-2 md:grid-cols-4` | `src/app/settings/page.tsx:332-360` |
| 목록 선택 | 선택 항목 하이라이트 | selected row `bg-blue-50/60` | `src/app/settings/page.tsx:365-388` |
| 추가/수정 액션 | create/update/delete 분리 버튼 | `data-testid="synonym-create/update/delete-submit"` | `src/app/settings/page.tsx:426,468-469` |

## 6.4 Header 관리자 기능 (Global)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| Admin mode 토글 | ADMIN 사용자에게만 버튼 노출 | `data-testid="admin-mode-toggle"` | `src/components/layout/header.tsx:456-467` |
| 알림 퀵액션 | 상태/담당자 변경 quick controls | `notification-quick-*` 테스트 키 | `src/components/layout/header.tsx:515-571` |
| 알림 강조 | 미읽음 알림은 blue tinted card | unread `border-blue-200 bg-blue-50/40` | `src/components/layout/header.tsx:496-500` |

## 6.5 반응형/가독성 규칙 (Auth/Admin)
| 원칙 설명 | 정밀 수치/규칙 | Tailwind 클래스 매핑 | 사용 화면 (소스) |
|---|---|---|---|
| 인증 카드 | 모바일 우선 단일 열 고정 | `max-w-md` + `w-full` | `src/app/login/page.tsx:48`, `src/app/signup/page.tsx:55` |
| 관리 폼 확장 | md 이상에서 다열 편집 폼 | `md:grid-cols-*` | `src/app/projects/page.tsx:418,441`, `src/app/team-members/page.tsx:505`, `src/app/settings/page.tsx:332` |
| 표 데이터 보호 | 열이 많은 영역은 horizontal scroll 허용 | `overflow-x-auto` | `src/app/activity-log/page.tsx:204`, `src/app/team-reports/page.tsx:273,313` |

