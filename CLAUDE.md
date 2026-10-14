# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Bachelor's thesis project: a web-based 3D space planning tool for interior designers, landscaping and horticulture companies, and individual users. Users register and log in, define an environment (floor or terrain size, floor material, simple walls), import 3D models (GLB only), position, rotate and scale them to real-world dimensions, save workspaces, and present designs through an interactive 3D view.

**Status:** see the roadmap in `plan.md` for current progress.

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

## Stack (TypeScript end to end)

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

Run from the repo root (see `README.md` for setup and notes):

```
npm install                 # all workspaces; postinstall runs `prisma generate`
npm run db:migrate          # prisma migrate dev (apps/api); SQLite at apps/api/prisma/dev.db
npm run db:seed             # prisma db seed (apps/api/prisma/seed.ts)
npm run dev                 # API :3001 + web :5173 (open 5173; Vite proxies /api and /files)
npm run build && npm start  # demo mode: API serves apps/web/dist on :3001
npm run lint                # ESLint (flat config at root)
npm run typecheck           # tsc in every workspace
npm test                    # Vitest in every workspace
npx vitest run src/config.test.ts -t "test name"   # single test, run inside the workspace folder
```

Environment variables (`apps/api/.env`, template in `.env.example`): `PORT`, `DATABASE_URL` (`file:./prisma/dev.db`, relative to `apps/api`), `JWT_SECRET` (min 16 chars), `UPLOAD_DIR`. Validated with Zod in `apps/api/src/config.ts`.

## Implementation notes (gotchas)

- **Prisma 7.10.0, pinned.** npm's `latest` tag points to a Prisma 8 RC; do not upgrade blindly. Prisma 7 specifics: config lives in `apps/api/prisma.config.ts` (loads `.env` itself, seed command defined there); the schema has no datasource `url`; the client is generated to `apps/api/src/generated/prisma` (git-ignored) and imported from `./generated/prisma/client`; it needs the `@prisma/adapter-better-sqlite3` driver adapter (see `apps/api/src/db.ts`).
- **API runtime:** TypeScript is run directly via the `tsx` loader (`node --import tsx`), with no compile step. Use `node --watch`, not `tsx watch`; the latter hangs on Windows under `concurrently`.
- **`@app/shared`** is consumed as TypeScript source (`exports` points at `src/index.ts`), so no build step is needed for it.
- **npm 11 install scripts** must be approved (`allowScripts` in the root `package.json`, versions pinned). Approving a new or upgraded native package: `npm install-scripts approve <pkg>`.
- **shadcn/ui:** `radix-nova` style (Radix base, lucide icons); add components with `cd apps/web && npx shadcn@latest add <name>`. Generated files in `src/components/ui/` are excluded from the `react-refresh` lint rule.
- **TypeScript 6 / ESLint 10 / Vitest 5 / Vite 8 / React 19 / React Router 8 / Tailwind 4 / Zod 4.** Check current APIs rather than assuming older ones.
- **Prisma CLI in non-interactive shells:** `prisma migrate dev` waits on stdin when its output is piped (e.g. through PowerShell `Select-String`); run it with stdin closed (Bash: `< /dev/null`). `migrate dev` does not regenerate the client in Prisma 7, so `prisma generate` runs as the `postdb:migrate` npm hook. Name migrations with `npm run db:migrate -- --name <name>`; don't chain commands inside `db:migrate`, or the arguments go to the last command.
- **Auth:** `apps/api/src/auth/` (bcryptjs, jose JWT in the httpOnly `session` cookie). Protect routes with `requireAuth(config.jwtSecret)` and read the user with `currentUserId(req)`. Throw `HttpError(status, message, fields?)` for expected failures and validate bodies with `parseInput(schema, req.body)`; `errors.ts` maps everything to `{ error, fields? }`.
- **Web data layer:** `apiGet`/`apiSend` in `apps/web/src/lib/api.ts` validate responses with shared schemas and throw `ApiError`. A global QueryClient handler treats any 401 as logged out. Wrap protected pages in the `RequireAuth` route (`features/auth/routes.tsx`). Forms use react-hook-form + `zodResolver(sharedSchema)` + `FormTextField`, with `applyServerErrors` mapping API field errors onto inputs.
- **Projects API** (`apps/api/src/projects/`): every route sits behind `requireAuth`; load projects through `findOwnedProject` / `assertOwnedProject` (404 for missing _or_ foreign projects). Scenes are stored as strings: write with `serializeScene`, read with `parseStoredScene` (both validate).
- **Web layout:** `PageLayout` (centred) vs `FullScreenLayout` (editor/viewer, `h-[calc(100svh-3.5rem)]`). The header must stay `h-14`. The editor page is `React.lazy`-loaded to keep three.js out of the main bundle.
- **Editor state:** `useEditorStore` (`apps/web/src/features/editor/store.ts`); add scene-editing actions there and test them with `useEditorStore.getState()`. Actions clamp to the shared schema limits so the scene is always valid, and set `isDirty`. Selectors must return stable references: use a module-level constant for empty fallbacks, never an inline `?? []`.
- **Environment logic** (presets, perimeter walls, `resizeEnvironment`, `wallTransform`) is pure code in `packages/shared/src/environment.ts`. Keep 3D components thin (`features/editor/scene/`), and keep colours and lighting in `features/editor/materials.ts`. Numeric inputs use `NumberField`, which commits on Enter or blur.
- **Dialog forms:** put the form in a child component inside `DialogContent` so it resets on reopen (avoid `setState` in effects; the lint rule blocks it).
- **Static files:** `/files/uploads/*` → `apps/api/uploads/`; `/files/models/*` → `apps/api/assets/models/`. The DB stores paths relative to these; `Model.ownerId === null` (built-in) decides the root (`modelUrl` in `apps/api/src/models/files.ts`).
- **Models:** upload checks are shared (`checkModelFile`, `checkGlbHeader` in `packages/shared/src/model.ts`). The server generates upload file names (UUID) and resolves them with `resolveUploadPath`. Built-ins come from `assets/models/models.json` via the idempotent seed; test models are generated by `npm run models:generate -w @app/api`.
- **Loading GLBs in the web app:** always go through `useModelGltf` (`features/editor/models/gltf.ts`), which uses the local Draco decoder in `apps/web/public/draco/` (copied from three.js on `npm install`, git-ignored), never drei's CDN default. Placed models are normalized with `normalizeBounds`, and native sizes are cached in `useModelSizeStore`. Call TanStack Query hooks outside `<Canvas>` and pass the data in as props.
