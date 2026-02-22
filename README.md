# Coreline

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-000000)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-149ECA)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16.0-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)
[![Playwright](https://img.shields.io/badge/E2E-Playwright-45BA63)](https://playwright.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org/)

Coreline은 멀티 프로젝트 운영을 위한 협업 대시보드입니다.  
조회 기능은 최대한 공개하고, 변경 기능은 인증/권한으로 보호하는 구조입니다.

## 1. 프로젝트 요약

| 항목 | 현재 상태 |
|---|---|
| 브랜드 | `Coreline` (사이드바 노란 배경 C 아이콘) |
| 프레임워크 | Next.js App Router |
| 인증 | NextAuth Credentials |
| 데이터베이스 | PostgreSQL + Prisma |
| 권한 | `ADMIN(팀장)`, `MEMBER(팀원)` |
| 공개 조회 | `/`, `/dashboard/*`, `/tasks`, `/projects`, `/team-members`, `/search` |
| 보호 기능 | 사용자/프로젝트/태스크 관리, 활동로그, 리포트, 설정 |
| 테스트 기준 | Playwright E2E 27개 시나리오 |

## 2. 핵심 기능

1. 포트폴리오/프로젝트 대시보드 분리
2. 태스크 멀티 프로젝트 필터 + 하위 업무 트리
3. 프로젝트 헬스/리스크/타임라인/드릴다운
4. 팀원 공개 요약 + 로그인 상세 실행 뷰
5. 로그인/회원가입 + 역할 기반 접근제어
6. 전사 공유 알림 + 관리자 퀵액션
7. 활동로그 Before/After + 필드 단위 Diff
8. 완료 프로젝트 이력 관리(완료/재개)
9. 팀 리포트(SLA/스냅샷/CSV)
10. 검색 고도화(범위/필터/동의어 사전)

## 화면 캡처

아래 이미지는 현재 로컬 프로젝트(더미 데이터 시드 적용) 기준으로 다시 캡처한 화면입니다.  
캡처 기준일: `2026-02-22`  
보호 화면(`Team Reports`, `Activity Log`, `Completed Projects`, `Settings`)은 관리자 로그인 상태에서 캡처했습니다.

이미지를 클릭하거나 `원본 보기` 링크로 원본 파일을 열 수 있습니다.

| 화면 | 미리보기 | 원본 |
|---|---|---|
| 포트폴리오 대시보드 | <a href="docs/images/screenshots/dashboard-portfolio.png"><img src="docs/images/screenshots/dashboard-portfolio.png" alt="포트폴리오 대시보드" width="460" /></a> | [원본 보기](docs/images/screenshots/dashboard-portfolio.png) |
| 프로젝트 대시보드(상세) | <a href="docs/images/screenshots/dashboard-project-detail.png"><img src="docs/images/screenshots/dashboard-project-detail.png" alt="프로젝트 대시보드 상세" width="460" /></a> | [원본 보기](docs/images/screenshots/dashboard-project-detail.png) |
| 태스크 | <a href="docs/images/screenshots/tasks.png"><img src="docs/images/screenshots/tasks.png" alt="태스크 화면" width="460" /></a> | [원본 보기](docs/images/screenshots/tasks.png) |
| 프로젝트 | <a href="docs/images/screenshots/projects.png"><img src="docs/images/screenshots/projects.png" alt="프로젝트 화면" width="460" /></a> | [원본 보기](docs/images/screenshots/projects.png) |
| 팀 멤버 | <a href="docs/images/screenshots/team-members.png"><img src="docs/images/screenshots/team-members.png" alt="팀 멤버 화면" width="460" /></a> | [원본 보기](docs/images/screenshots/team-members.png) |
| 팀 리포트(관리자) | <a href="docs/images/screenshots/team-reports.png"><img src="docs/images/screenshots/team-reports.png" alt="팀 리포트 화면" width="460" /></a> | [원본 보기](docs/images/screenshots/team-reports.png) |
| 활동 로그(관리자) | <a href="docs/images/screenshots/activity-log.png"><img src="docs/images/screenshots/activity-log.png" alt="활동 로그 화면" width="460" /></a> | [원본 보기](docs/images/screenshots/activity-log.png) |
| 완료 프로젝트(관리자) | <a href="docs/images/screenshots/completed-projects.png"><img src="docs/images/screenshots/completed-projects.png" alt="완료 프로젝트 화면" width="460" /></a> | [원본 보기](docs/images/screenshots/completed-projects.png) |
| 설정(관리자) | <a href="docs/images/screenshots/settings.png"><img src="docs/images/screenshots/settings.png" alt="설정 화면" width="460" /></a> | [원본 보기](docs/images/screenshots/settings.png) |
| 검색 | <a href="docs/images/screenshots/search.png"><img src="docs/images/screenshots/search.png" alt="검색 화면" width="460" /></a> | [원본 보기](docs/images/screenshots/search.png) |
| 로그인 | <a href="docs/images/screenshots/login.png"><img src="docs/images/screenshots/login.png" alt="로그인 화면" width="460" /></a> | [원본 보기](docs/images/screenshots/login.png) |
| 회원가입 | <a href="docs/images/screenshots/signup.png"><img src="docs/images/screenshots/signup.png" alt="회원가입 화면" width="460" /></a> | [원본 보기](docs/images/screenshots/signup.png) |

## 3. 라우팅 구조

| 구분 | 경로 |
|---|---|
| 공개 대시보드 | `/`, `/dashboard/portfolio`, `/dashboard/projects/:id` |
| 공개 작업 화면 | `/tasks`, `/projects`, `/projects/:id`, `/team-members`, `/search` |
| 인증 화면 | `/login`, `/signup` |
| 로그인 필요 | `/settings`, `/completed-projects`, `/activity-log`, `/team-reports` |

## 4. 권한 정책

`src/lib/permissions.ts` 기준:

| 기능 | ADMIN | MEMBER | 비로그인 |
|---|---|---|---|
| 사용자 관리 | 가능 | 불가 | 불가 |
| 프로젝트 생성/수정/완료/재개 | 가능 | 불가 | 불가 |
| 태스크 조회 | 전체 | 본인 생성/담당 | 공개 API만 |
| 태스크 생성/수정/삭제 | 전체 | 본인 생성/담당 | 불가 |
| 리포트 스냅샷/CSV | 가능 | 불가 | 불가 |
| 알림 퀵액션 | 가능 | 불가 | 불가 |
| 활동로그 조회 | 전체 | 본인 수행분만 | 불가 |

## 5. 공개/보호 접근 제어

`src/proxy.ts` 기준:

1. `/api/public/*`는 공개
2. `/api/*`(public 제외)는 비로그인 시 `401`
3. 보호 페이지는 비로그인 시 `/login` 리다이렉트
4. 로그인 사용자가 `/login`, `/signup` 접근 시 `/`로 이동

## 6. 데이터 모델(Prisma)

핵심 모델:

1. `User`, `ProfileSettings`
2. `Project` (`isArchived` + `completedAt` 분리)
3. `Task` (soft delete: `deletedAt`, parent-child 구조)
4. `Notification`
5. `SearchHistory`, `SearchSynonym`
6. `AuditLog`
7. `TeamWeeklySnapshot`

스키마 파일:
`prisma/schema.prisma`

## 7. API 구성

### 7.1 공개 API

1. 대시보드
`GET /api/public/dashboard/portfolio/overview`  
`GET /api/public/dashboard/projects/:id/overview`  
`GET /api/public/dashboard/kpi`  
`GET /api/public/dashboard/weekly`  
`GET /api/public/dashboard/status-distribution`  
`GET /api/public/dashboard/recent-activity`

2. 업무/프로젝트/팀원
`GET /api/public/tasks`  
`GET /api/public/projects`  
`GET /api/public/projects/:id/overview`  
`GET /api/public/team-members`

3. 검색
`GET /api/public/search`

### 7.2 인증 필요 API

1. 인증/프로필
`POST /api/auth/signup`  
`/api/auth/[...nextauth]`  
`GET /api/me`  
`GET /api/profile/overview`  
`GET/PATCH /api/profile/settings`

2. 태스크/프로젝트/사용자
`GET/POST /api/tasks`  
`PATCH/DELETE /api/tasks/:id`  
`GET/POST /api/projects`  
`PATCH /api/projects/:id`  
`GET /api/users`  
`PATCH/DELETE /api/users/:id`

3. 완료/활동/리포트
`GET /api/projects/completed`  
`PATCH /api/projects/:id/complete`  
`PATCH /api/projects/:id/reopen`  
`GET /api/activity-logs`  
`GET /api/team-reports/weekly`  
`GET/POST /api/team-reports/weekly/snapshots`  
`GET /api/team-reports/weekly/export`

4. 알림/검색기록
`GET /api/notifications`  
`PATCH /api/notifications/read-all`  
`PATCH /api/notifications/:id/read`  
`PATCH /api/notifications/:id/action`  
`GET/POST /api/search/history`  
`DELETE /api/search/history/:id`

## 8. 검색/알림/활동로그 운영 포인트

### 8.1 검색

1. 공통 검색 로직: `src/lib/search.ts`
2. 필터: `scope + status + phase + projectId`
3. 한/영 동의어 확장 지원
4. 관리자만 동의어 사전 관리 가능(`Settings`)

### 8.2 알림

1. 태스크 생성/수정/삭제/상태변경/담당변경 시 전원 fan-out
2. 읽음 상태는 사용자별 독립
3. 관리자만 헤더 퀵액션(상태/담당자 즉시 변경) 사용 가능

### 8.3 활동로그

1. `beforeJson`, `afterJson` 저장
2. API에서 `diff` 생성 후 필드 단위 강조
3. MEMBER는 본인 로그만, ADMIN은 전체 로그 조회

## 9. 팀 리포트(SLA/스냅샷/CSV)

### 9.1 SLA 지표

1. 진행중 건수
2. 지연 건수/지연률
3. 오버듀 오픈 건수/비율
4. 7일 내 마감 건수
5. 완료 비율

### 9.2 스냅샷 정책

1. 주 시작일: `Asia/Seoul` 기준 월요일
2. 주차당 1개(`weekStart` unique)
3. 생성: ADMIN 전용
4. 조회: 로그인 사용자 가능
5. CSV: ADMIN 전용(UTF-8 BOM)

## 10. 개발 환경 실행

### 10.1 환경 변수

`.env.example` 기반 `.env` 생성:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rich_properties?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-strong-random-secret"
```

### 10.2 PostgreSQL 실행

Docker 사용 시:

```bash
docker compose up -d
```

### 10.3 앱 실행

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## 11. 시드 계정

공통 비밀번호:
`Password123!`

| 역할 | 이메일 |
|---|---|
| ADMIN(팀장) | `user1@richprop.local` |
| MEMBER(팀원) | `user2@richprop.local` ~ `user7@richprop.local` |

## 12. 품질 검증 명령어

```bash
npm run lint
npm run build
npm run test:e2e
```

전체 검증:

```bash
npm run verify:all
```

## 13. E2E 테스트 범위

1. 공개/보호 접근 경계
2. 멀티 프로젝트 대시보드/필터
3. 태스크 권한 + 검색 필터 조합
4. 완료 프로젝트 완료/재개 흐름
5. 공유 알림 브로드캐스트
6. 활동로그 권한/필드 Diff
7. 팀 리포트 권한 + CSV
8. 알림 퀵액션
9. 헤더 프로필 팝오버
10. 동의어 사전 관리 및 검색 반영

상세 체크리스트:
`docs/qa/e2e-checklist.md`

## 14. 트러블슈팅

### 14.1 `ERR_CONNECTION_REFUSED`

1. 포트 확인
```bash
netstat -ano | findstr :3000
```
2. 서버 실행
```bash
npm run dev
```

### 14.2 Prisma Client 불일치

```bash
npm run prisma:migrate
npm run prisma:generate
```

### 14.3 개발 데이터 초기화

```bash
npm run prisma:seed
```

주의: seed는 개발용 초기 데이터 재적재 용도입니다.

## 15. 관련 문서

1. 작업 모드 가이드: `docs/WORK_MODE.md`
2. QA 체크리스트: `docs/qa/e2e-checklist.md`
3. 프로젝트 대시보드 점검: `docs/qa/project-dashboard-closeout.md`

## 16. 추가 구현 계획(사전 로드맵)

### 16.1 단기(다음 스프린트)

1. 프로젝트 대시보드 성능 최적화
2. 팀 리포트 필터 UX 개선(저장된 필터 프리셋)
3. 알림 센터 사용성 개선(유형별 탭, 일괄 액션)
4. 검색 결과 정렬/우선순위 개선(정확도 우선)

### 16.2 중기(운영 고도화)

1. 리포트 스냅샷 비교 화면(주차 간 증감 비교)
2. 활동로그 Diff 뷰 고도화(구조화된 JSON 트리)
3. 프로젝트 리스크 규칙 커스터마이즈(임계값 관리자 설정)
4. 프로젝트별 운영 지표 목표치(목표 vs 실적) 도입

### 16.3 장기(확장)

1. 외부 검색 엔진 연동(대용량 전문검색)
2. 알림 채널 확장(이메일/푸시, 템플릿화)
3. 멀티 워크스페이스/조직 단위 분리
4. 데이터 파이프라인 기반 BI 리포팅 연동

## 17. README 유지관리 규칙

1. 기능 추가/삭제 시 라우트/API 표를 같은 PR에서 갱신
2. 권한 정책 변경 시 4장(권한 정책)과 E2E 범위를 함께 수정
3. 화면 변경 시 `docs/images/screenshots` 캡처를 최신화
4. 마이그레이션 추가 시 실행 순서와 트러블슈팅 문구 동시 갱신
