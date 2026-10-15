# Spatial Planner 3D

Web-based 3D space planning tool (bachelor's thesis project). Users create a virtual room or garden,
place 3D models scaled to real-world dimensions, save their workspaces and present them to clients.

- Project plan: [`plan.md`](plan.md) · Sprint details: [`docs/sprints/`](docs/sprints/)
- Manual tests: [`docs/manual-test-checklist.md`](docs/manual-test-checklist.md) · Defence walkthrough: [`docs/demo-script.md`](docs/demo-script.md)
- Runs entirely locally: SQLite database file, uploads in a local folder, no Docker, no cloud services.

## Requirements

- **Node.js 22+** (developed on Node 24) and **npm 11+**
- Windows, macOS or Linux. No database server needs to be installed.

## First-time setup

```bash
# 1. Install all workspaces (also generates the Prisma client)
npm install

# 2. Create the API environment file and set a random JWT_SECRET (at least 16 characters)
cp apps/api/.env.example apps/api/.env        # PowerShell: Copy-Item apps\api\.env.example apps\api\.env

# 3. Create/update the SQLite database and load seed data
npm run db:migrate
npm run db:seed
```

## Running

### Development (hot reload)

```bash
npm run dev
```

- Web app: <http://localhost:5173> (open this one)
- API: <http://localhost:3001> (the web app reaches it through the Vite proxy at `/api` and `/files`)

The home page shows a **System status** card. If API and Database both show `ok`, everything is wired up.

### Demo account

`npm run db:seed` creates **`demo@example.com` / `demo1234`** with three example projects: "Living room" (interior), "Garden" (exterior) and "Performance test (50 objects)". Re-seeding resets the demo password and re-creates missing example projects, but never overwrites existing ones.

### Measuring fps

Add `?fps` to an editor or viewer URL (for example `http://localhost:5173/projects/<id>?fps`) to show an fps counter in the top-left corner of the 3D view.

### Demo / presentation mode

```bash
npm run build   # build the web app into apps/web/dist
npm start       # API serves the built app + API on one port
```

Open <http://localhost:3001>. Only one process runs, which is the setup to use at the thesis defence.

## Commands

| Command              | What it does                                                  |
| -------------------- | ------------------------------------------------------------- |
| `npm run dev`        | Start API and web app in development mode                     |
| `npm run build`      | Production build of the web app                               |
| `npm start`          | Run the API, serving the built web app (demo mode)            |
| `npm run lint`       | ESLint over the whole repo                                    |
| `npm run typecheck`  | TypeScript check in every workspace                           |
| `npm test`           | Vitest unit tests in every workspace                          |
| `npm run format`     | Format everything with Prettier                               |
| `npm run db:migrate` | Apply Prisma schema changes to SQLite + regenerate the client |
| `npm run db:seed`    | Load seed data (built-in models, demo user, example projects) |

Run a single test file or test (from inside the workspace folder, e.g. `apps/api`):

```bash
npx vitest run src/config.test.ts -t "rejects a short JWT secret"
```

Create a migration after changing `apps/api/prisma/schema.prisma`:

```bash
npm run db:migrate -- --name describe_the_change
```

Regenerate or check the built-in models (after changing `apps/api/scripts/generate-models.ts` or `catalog.ts`):

```bash
npm run models:generate -w @app/api   # writes apps/api/assets/models/*.glb + models.json
npm run models:check -w @app/api      # prints each model's size and validates its header
npm run db:seed                       # registers the built-ins in the database
```

Reset the database (deletes all data):

```bash
cd apps/api && npx prisma migrate reset
```

## Project structure

```
apps/web/          React + Vite + Three.js (React Three Fiber, drei) + shadcn/ui
apps/api/          Express API, Prisma schema + migrations + seed, SQLite file
  assets/models/   built-in GLB models (committed)
  uploads/         user uploads and thumbnails (git-ignored, created automatically)
packages/shared/   Zod schemas and types shared by web and API (imported as @app/shared)
docs/sprints/      one plan file per sprint
docs/              manual test checklist, demo script
```

## Environment variables (`apps/api/.env`)

| Variable       | Default                | Notes                                      |
| -------------- | ---------------------- | ------------------------------------------ |
| `PORT`         | `3001`                 | API port (the Vite proxy expects 3001)     |
| `DATABASE_URL` | `file:./prisma/dev.db` | SQLite file, relative to `apps/api`        |
| `JWT_SECRET`   | (none, required)       | At least 16 characters; keep it out of git |
| `UPLOAD_DIR`   | `uploads`              | Upload folder, relative to `apps/api`      |

## Notes worth knowing

- **Moving the demo to another laptop:** copy the project (without `node_modules`), then run the
  first-time setup. The database file (`apps/api/prisma/dev.db`) and `uploads/` are git-ignored, so
  copy them too if you want to keep your data. Otherwise the seed recreates the demo data.
- **Adding shadcn/ui components:** `cd apps/web && npx shadcn@latest add <component>`. Components are
  copied into `apps/web/src/components/ui/` and can be edited.
- **Prisma is pinned to 7.10.0.** The npm `latest` tag currently points to a Prisma 8 release
  candidate, so don't run a bare `npm install prisma@latest`.
- **npm install-script approvals:** npm 11 blocks dependency install scripts unless approved. The
  ones this project needs (Prisma, better-sqlite3, esbuild) are approved in the root
  `package.json` (`allowScripts`). If `npm install` warns about a new package's scripts, review it
  with `npm install-scripts ls`.
- **`npm audit` warnings** come from database drivers bundled with the Prisma CLI, which is used
  only during development, never by the running app. `npm audit fix --force` would downgrade
  Prisma, so don't run it.
- **API dev server** uses `node --watch` with the `tsx` loader. `tsx watch` hangs on Windows when
  started through `concurrently`.
- **Draco decoder:** `npm install` copies three.js's Draco decoder into `apps/web/public/draco/` (git-ignored), so compressed models load without internet. If compressed models fail to load, re-run `npm install`.
- **Line endings** are normalised to LF via `.gitattributes`.
