# Sprint 0: Project setup

**Status:** Done (2026-10-13)
**Depends on:** none
**Requirements covered:** foundation for all of them

## Goal

An empty but working monorepo: `npm install` at the root installs everything, `npm run dev` starts the web app and the API, and the lint, typecheck and test scripts run successfully.

## Scope

- **In:** npm workspaces, Vite + React app, Express API, shared package, Prisma + SQLite, uploads folder, tooling
- **Out:** any features (auth, projects, 3D scene)

## Tasks (high level)

- **Root:** `package.json` with workspaces (`apps/*`, `packages/*`); scripts `dev`, `build`, `lint`, `typecheck`, `test`; shared TypeScript config (strict mode); ESLint + Prettier; `.gitignore` (including `.env`, `*.db` and `apps/api/uploads/`; `apps/api/assets/` stays committed)
- **Web:**
  - Vite + React + TypeScript app
  - Tailwind + shadcn/ui (`npx shadcn@latest init`, with the `@/` path alias; components go in `src/components/ui`)
  - React Router with placeholder pages
  - React Three Fiber + drei installed
  - Vite dev proxy for `/api` and `/files` to the API
- **API:** Express + TypeScript (run with tsx in development); all routes under `/api`; a `/api/health` endpoint; `.env.example`. No CORS is needed thanks to the proxy.
- **API data:** Prisma initialized with the SQLite provider; empty first migration; a seed script (`npx prisma db seed`) that does nothing yet, which later sprints extend
- **Files:** serve `apps/api/uploads/` (user files, created automatically if missing) and `apps/api/assets/models/` (built-in models, committed) statically under `/files`
- **Shared:** `packages/shared` importable as `@app/shared` from both apps
- **Git:** the repository already exists (`main`, remote `origin`); add the `.gitignore` above

## Acceptance criteria

- [x] `npm install` and then `npm run dev` start both apps without errors
- [x] The web app calls `/api/health` through the Vite proxy and shows the result inside a shadcn/ui component (for example a `Card`)
- [x] Both apps import a type from `@app/shared`
- [x] `npm run lint`, `npm run typecheck` and `npm run test` all pass
- [x] `npx prisma migrate dev` creates the SQLite file, and `npx prisma db seed` runs without errors

## Tests

One example Vitest test in each workspace, to confirm the test setup works.

## Deliverables for the thesis

- Architecture diagram (web, API, SQLite, uploads folder)
- Short justification of the chosen technologies

## Notes / decisions

- **Versions resolved (October 2026):** Node 24, TypeScript 6, React 19, Vite 8, Tailwind 4, Vitest 5, ESLint 10, Express 5, Zod 4, React Router 8, React Three Fiber 9 / drei 10, three r186.
- **Prisma pinned to 7.10.0.** npm's `latest` tag pointed to an 8.0 release candidate; a stable major is the safer choice for a thesis. Prisma 7 needs a driver adapter for SQLite (`@prisma/adapter-better-sqlite3`) and a `prisma.config.ts`.
- **No first migration yet:** Prisma creates no migration for a schema without models. The database file is created, and the first real migration comes with `User` in Sprint 1.
- **API runs TypeScript directly** via the `tsx` loader, with no build step. The dev server uses `node --watch`, because `tsx watch` hangs on Windows when its stdin is piped (as `concurrently` does).
- **shadcn/ui:** Radix base with the "Nova" preset (Geist font, lucide icons).
- **Static files** are served under `/files/uploads/` and `/files/models/` (separate prefixes, so a user upload can never shadow a built-in model).
- **npm 11** requires approving install scripts; approved: prisma, @prisma/engines, better-sqlite3, esbuild.
- **Demo mode verified:** `npm run build && npm start` serves the app and API on port 3001, including deep links (SPA fallback).
