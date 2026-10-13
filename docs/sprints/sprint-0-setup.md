# Sprint 0: Project setup

**Status:** Planned
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
- [ ] `npm install` and then `npm run dev` start both apps without errors
- [ ] The web app calls `/api/health` through the Vite proxy and shows the result inside a shadcn/ui component (for example a `Card`)
- [ ] Both apps import a type from `@app/shared`
- [ ] `npm run lint`, `npm run typecheck` and `npm run test` all pass
- [ ] `npx prisma migrate dev` creates the SQLite file, and `npx prisma db seed` runs without errors

## Tests
One example Vitest test in each workspace, to confirm the test setup works.

## Deliverables for the thesis
- Architecture diagram (web, API, SQLite, uploads folder)
- Short justification of the chosen technologies

## Notes / decisions
_Filled in during the sprint._
