# Rich Properties

Multi-project operations dashboard built with Next.js App Router, Prisma, PostgreSQL, and NextAuth (Credentials).

## Core capabilities

- Public read pages: `/`, `/dashboard/portfolio`, `/dashboard/projects/:id`, `/tasks`, `/projects`, `/team-members`
- Auth + role model: `ADMIN(팀장)` / `MEMBER(팀원)`
- Admin mode toggle (UI safety layer, default OFF)
- Task CRUD with role-based permission checks
- Project health/risk/timeline overview
- Team members page with project assignment buckets
- In-app notifications and personal search history (logged-in users)
- Admin-managed search synonym dictionary (global + project scope, in `/settings`)

## Environment

Create `.env` from `.env.example`.

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rich_properties?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-strong-random-secret"
```

## Run

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Optional PostgreSQL via Docker:

```bash
docker compose up -d
```

## Seed accounts (dev)

- 공통 비밀번호: `Password123!`
- 팀장(ADMIN): `user1@richprop.local`
- 팀원(MEMBER): `user2@richprop.local` ~ `user7@richprop.local`

## Seeded projects

- `Rich Properties Platform`
- `Smart Leasing Mobile`
- `Sales Analytics CRM`

## Main routes

- Public dashboards: `/`, `/dashboard/portfolio`, `/dashboard/projects/:id`
- Tasks: `/tasks`
- Projects: `/projects`, `/projects/:id`
- Team members: `/team-members`
- Auth: `/login`, `/signup`
- Settings (auth required): `/settings`

## Main APIs

- Auth: `/api/auth/[...nextauth]`, `/api/auth/signup`
- Public read: `/api/public/*`
- Tasks: `/api/tasks`, `/api/tasks/:id`
- Projects (admin write): `/api/projects`, `/api/projects/:id`
- Project search synonyms (admin): `/api/projects/settings/synonyms`, `/api/projects/settings/synonyms/:id`
- Users (admin): `/api/users`, `/api/users/:id`
- Notifications: `/api/notifications*`
- Search: `/api/search*`
- Profile settings: `/api/profile/settings`

## Quality checks

```bash
npm run lint
npm run build
npm run test:e2e
npm run verify:all
npm run run:once
```

## E2E

Playwright E2E validates project-level permission/filter combinations for guest/member/admin.

```bash
npx playwright install chromium
npm run test:e2e
```

Detailed checklist: `docs/qa/e2e-checklist.md`

Work mode guide: `docs/WORK_MODE.md`
