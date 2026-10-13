# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Bachelor's thesis project: a web-based 3D space planning tool for interior designers, landscaping and horticulture companies, and individual users. Users register and log in, define an environment (floor or terrain size, floor material, simple walls), import 3D models (GLB only), position, rotate and scale them to real-world dimensions, save workspaces, and present designs through an interactive 3D view.

**Status:** greenfield. The repository has no code yet. Update this file as the code below is scaffolded.

## Planning

- `plan.md` is the main plan: requirements (FR/NFR IDs), design, the sprint roadmap with each sprint's status, testing, risks.
- `docs/sprints/sprint-N-*.md` holds each sprint's goal, scope, tasks and acceptance criteria. Before working on a feature, read `plan.md` and the current sprint file, and stay within that sprint's scope.
- When sprint work finishes, update the status in both the `plan.md` roadmap table and the sprint file. Record notable decisions under the sprint file's "Notes / decisions" section, because they feed the thesis.

## Sprint workflow

1. Implement the sprint's tasks; `npm run lint`, `npm run typecheck` and `npm run test` must pass.
2. Claude reviews the full sprint diff (correctness, consistency with `plan.md` and the sprint file) and fixes the findings.
3. The user tests the sprint manually against its acceptance criteria. Wait for their confirmation; do not mark anything Done before it.
4. Update the sprint status and notes, then commit once per sprint (for example `Sprint 3: environment`) and push to `main`. The user is the sole developer, so no branches or PRs are needed.

## Scope limits (deliberate)

Keep it simple. No photorealistic rendering, post-processing, animation, physics, dynamic or moving models, or high-detail effects. Prefer ready-made `@react-three/drei` helpers (`OrbitControls`, `TransformControls`, `useGLTF`, `Grid`) over custom 3D code.

## Planned stack (TypeScript end to end)

- **Web (`apps/web`):** React + Vite, Three.js through React Three Fiber + drei, Zustand (editor state), Tailwind CSS + shadcn/ui (components in `apps/web/src/components/ui`, added with `npx shadcn@latest add <name>`; use these instead of hand-rolled UI primitives), React Router, TanStack Query
- **API (`apps/api`):** Node.js + Express, Prisma + SQLite (single file, `apps/api/prisma/dev.db`), JWT in an httpOnly cookie + bcrypt, Multer for model uploads
- **Shared (`packages/shared`):** Zod schemas and types used by both web and API
- **Infra:** npm workspaces monorepo. This is a demo/presentation project: no Docker, no cloud services. Everything runs locally.
- **Tests:** Vitest unit tests only (pure logic: schemas, scaling math, store actions, helpers). No end-to-end or API integration test suites; features are checked manually against each sprint's acceptance criteria.

## Architecture and key decisions

- **Units:** 1 scene unit = 1 metre everywhere. Objects rotate around Y only (`rotationY`, radians; the UI shows degrees) and scale uniformly (`scale` is one number). Objects always stand on the floor (y = 0).
- **Real-world sizing:** when a model loads, measure its native bounding box (`THREE.Box3().setFromObject`), centre it, and put its base on the floor (y = 0). Native size is cached in memory per `modelId`, never stored in the DB. The user enters a target dimension in metres, and the app applies one uniform scale factor so proportions are kept.
- **Scene persistence:** a project's scene is stored as a serialized JSON string in `Project.scene` (a SQLite text column). The API parses it and validates it with Zod; it is never queried by its contents. Its shape is `{ version, environment: { type, width, depth, floorMaterial, walls[] }, objects: [{ id, modelId, position: [x, y, z], rotationY, scale }] }`; walls are `{ id, start: [x, z], end: [x, z], height, thickness }`. The Zod schema in `packages/shared` is the only definition of this shape; the API validates against it on save.
- **Editor state:** the live scene lives in a Zustand store in `apps/web`. React Three Fiber components render from the store, and transform gizmo changes write back to it. Save serializes the store to the scene JSON.
- **Data model:** `User`, `Project` (owner, name, scene, optional shareToken and thumbnail), `Model` (an `ownerId` of null means a built-in model; also stores filePath and category; no dimensions).
- **File storage:** user uploads and thumbnails go to `apps/api/uploads/` (git-ignored, configurable through `UPLOAD_DIR`). Built-in models are committed in `apps/api/assets/models/`. Both are served statically under `/files`. The Draco decoder is served locally from `apps/web/public/draco/` (no CDN), so the demo works offline. The database stores only the relative file path. Do not add S3 or other cloud storage.
- **Routing / origin:** all API routes are under `/api`. In development, Vite proxies `/api` and `/files` to the API; for the demo, the API serves the built web app. The browser always sees one origin, so the JWT cookie works with no CORS setup.
- **Seed:** `apps/api/prisma/seed.ts` exists from Sprint 0 and grows each sprint (built-in models, demo user, example projects).
- **Sharing:** `/view/:shareToken` opens a read-only viewer with orbit controls only.

## Commands

The commands below are the planned scripts. Check them against `package.json` once it exists.

```
npm install                       # install all workspaces
npx prisma migrate dev            # run in apps/api; creates/updates the SQLite file
npx prisma db seed                # run in apps/api; demo user, built-in models, example projects
npm run dev                       # start web + api
npm run lint / npm run typecheck
npm run test                      # Vitest across workspaces
npx vitest run path/to/file.test.ts -t "test name"   # single test
```

Environment variables for the API: `DATABASE_URL` (for example `file:./dev.db`), `JWT_SECRET`, `UPLOAD_DIR`.
