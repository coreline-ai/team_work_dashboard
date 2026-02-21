# Rich Properties

Next.js 16 + Prisma + PostgreSQL + NextAuth(Credentials) 기반 내부 협업 대시보드입니다.

## 핵심 기능

- 로그인/회원가입, 세션 기반 접근제어
- 역할 기반 권한(`ADMIN`, `MEMBER`)
- 태스크 CRUD(소프트 삭제), 팀원 관리(관리자 전용)
- 대시보드 실시간 집계 API
- 인앱 알림(배정/상태변경/마감임박)
- 개인 검색 + 최근 검색 기록
- 개인 설정(ProfileSettings) API 연동

## 환경 변수

`.env.example`를 복사해 `.env`를 만들고 값을 채우세요.

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rich_properties?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-strong-random-secret"
```

## 설치 및 실행

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

개발 서버: `http://localhost:3000`

### PostgreSQL 빠른 실행(Docker)

```bash
docker compose up -d
```

## 초기 시드 계정

- 관리자: `user1@richprop.local`
- 비밀번호: `Password123!`

## 스크립트

- `npm run dev`: 개발 서버
- `npm run lint`: ESLint 검사
- `npm run build`: 프로덕션 빌드
- `npm run start`: 프로덕션 서버
- `npm run prisma:generate`: Prisma Client 생성
- `npm run prisma:migrate`: DB 마이그레이션
- `npm run prisma:seed`: 시드 데이터 적재

## 주요 라우트

- `/login`, `/signup`
- `/` 대시보드
- `/tasks` 태스크 CRUD
- `/projects` 프로젝트 집계
- `/team-members` 관리자 전용 팀원 관리
- `/settings` 개인 설정

## 주요 API

- Auth: `/api/auth/[...nextauth]`, `/api/auth/signup`
- Users: `/api/users`, `/api/users/:id`
- Tasks: `/api/tasks`, `/api/tasks/:id`
- Dashboard: `/api/dashboard/*`
- Notifications: `/api/notifications*`
- Search: `/api/search*`
- Settings: `/api/profile/settings`
