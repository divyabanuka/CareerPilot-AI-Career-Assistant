# CareerPilot – AI Career Assistant

CareerPilot is a full-stack career command center for college students and fresh graduates to track opportunities, build evidence, and make their next move visible.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/careerpilot/src/App.tsx` — responsive landing page, protected app shell, CRUD screens, assistant, resume lab, analytics, and profile UI.
- `artifacts/api-server/src/routes/careerpilot.ts` — authenticated CareerPilot API routes, demo analysis logic, seeded first-run data, and account-scoped queries.
- `lib/api-spec/openapi.yaml` — source of truth for the generated client and Zod API contracts.
- `lib/db/src/schema/index.ts` — PostgreSQL schema for profiles and account-owned career records.
- `artifacts/careerpilot/src/index.css` — shared light/dark theme, typography, motion, and surface tokens.

## Architecture decisions

- Clerk owns browser authentication and sessions; API routes use Clerk's session cookie and never expose bearer tokens to the web client.
- Career records store `userId` on every table and are queried with ownership predicates so profiles, applications, skills, certificates, goals, and activities remain account-scoped.
- Resume analysis and CareerPilot AI are deliberately local demo heuristics with typed API boundaries, so a paid AI provider can be connected later without changing the UI contract.
- The UI uses generated React Query hooks from the OpenAPI contract so mutations can invalidate the relevant user-scoped lists.

## Product

Landing and auth flows lead into a protected dashboard with readiness progress, deadlines, activity, recommendations, a searchable job/application tracker, skills and certificates, career goals, resume analysis, a demo AI assistant, analytics, profile editing, and light/dark mode.

## User preferences

The user asked for a polished startup-quality SaaS experience that is responsive on desktop and mobile, with working CRUD and real per-account persistence rather than a static prototype.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before using generated hooks or schemas.
- The Vite app requires workflow-provided `PORT` and `BASE_PATH`; use the managed `artifacts/careerpilot: web` workflow for previews and production builds.
- The first authenticated profile request seeds a small example dataset for that account only; later requests use the stored PostgreSQL records.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
