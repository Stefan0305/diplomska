# Spatial Planner 3D: Development Plan

Bachelor's thesis project. This is the main plan file. Details for each sprint live in [`docs/sprints/`](docs/sprints/).

## 1. Project overview

- **Working title:** Spatial Planner 3D
- **Goal:** plan interior and outdoor spaces in the browser using 3D models scaled to real-world dimensions, and present the result to clients through an interactive 3D view.
- **Target users:** interior designers, landscaping and horticulture companies, individual users.
- **Nature of the project:** a demo for the thesis presentation. It runs locally on one machine: SQLite database, a local uploads folder, no Docker and no cloud services.
- **Out of scope:** photorealistic rendering, post-processing, animation, moving or dynamic models, physics, multi-user real-time editing, mobile apps.

## 2. Requirements (analysis)

### Functional requirements

| ID  | Requirement                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR1 | Register, log in and log out with email and password                                                                                                          |
| FR2 | Dashboard: list, create, rename, duplicate and delete projects (workspaces)                                                                                   |
| FR3 | Environment setup: type (interior/exterior), floor or terrain size in metres, floor material preset, simple walls (start point, end point, height, thickness) |
| FR4 | Model library: upload GLB models (a single binary file; size limit, for example 20 MB); browse built-in and personal models by category                       |
| FR5 | Place models in the scene; select, move, rotate (Y axis, with snapping) and delete them                                                                       |
| FR6 | Real-world sizing: show each object's dimensions in metres; set a target dimension and scale proportionally                                                   |
| FR7 | Save and load workspaces (explicit save plus autosave)                                                                                                        |
| FR8 | Camera: orbit, pan and zoom; preset views (top, front, perspective)                                                                                           |
| FR9 | Presentation: read-only share link and screenshot export (PNG)                                                                                                |

### Non-functional requirements

| ID   | Requirement                                                                                 |
| ---- | ------------------------------------------------------------------------------------------- |
| NFR1 | Runs in current Chrome, Firefox and Edge (WebGL 2)                                          |
| NFR2 | A scene with about 50 objects stays above 30 fps on a mid-range laptop                      |
| NFR3 | Passwords hashed with bcrypt; JWT in an httpOnly cookie; uploads validated by type and size |
| NFR4 | 1 scene unit = 1 metre throughout the app                                                   |
| NFR5 | Simple, learnable UI: a first-time user can place a model in under 2 minutes                |

**Deliverables:** use-case diagram, user stories with acceptance criteria.

## 3. System design

- **Architecture:** a single-page app (React) calls a REST API (Express) under `/api`. The API uses SQLite (one local file) through Prisma. Uploaded files are stored on local disk. During development the Vite dev server proxies `/api` and `/files` to the API, so the browser only ever sees one origin; for the demo the API serves the built web app. Either way the auth cookie works without CORS.
- **Technology stack (TypeScript throughout):**
  - Web: React + Vite, Three.js via React Three Fiber + drei, Zustand, Tailwind CSS + shadcn/ui, React Router, TanStack Query
  - API: Node.js + Express, Prisma + SQLite, JWT + bcrypt, Multer
  - Shared: Zod schemas and types
  - Tests: Vitest (unit tests)
- **Monorepo (npm workspaces):**
  ```
  apps/web/         React + Three.js frontend
  apps/api/         Express API, Prisma schema + seed, SQLite file
    assets/models/  built-in GLB models (committed to git)
    uploads/        user uploads and thumbnails (git-ignored)
  packages/shared/  Zod schemas + types (imported as @app/shared)
  ```
- **Data model:**
  - `User(id, email, passwordHash, name, createdAt)`
  - `Project(id, ownerId, name, scene, thumbnail?, shareToken?, updatedAt)`: `scene` is a JSON string validated with Zod
  - `Model(id, ownerId?, name, filePath, category, createdAt)`: a null `ownerId` marks a built-in model. Native dimensions are not stored; they are measured in the browser every time a model loads.
- **Scene JSON:** `{ version, environment: { type, width, depth, floorMaterial, walls[] }, objects: [{ id, modelId, position: [x, y, z], rotationY, scale }] }`.
  - Units are metres and `rotationY` is in radians (Y axis only).
  - `scale` is a single uniform number.
  - Walls are `{ start: [x, z], end: [x, z], height, thickness }`.
- **REST API (prefix `/api`):** `/auth/*`, `/projects` (CRUD), `/projects/:id/scene`, `/models` (upload, list, delete), `/share/:token`. Model files and thumbnails are served statically under `/files`.
- **UI:** Login/Register, Dashboard, Editor (toolbar, model library panel, 3D viewport, properties panel) and Viewer (read-only)

**Deliverables:** architecture diagram, ER diagram, sequence diagrams (login, save scene, upload model), wireframes.

## 4. Implementation roadmap

The work is done in short, iterative sprints. A sprint ends when its acceptance criteria are met, not on a fixed date. Each sprint has its own file with its goal, tasks and acceptance criteria. The estimates assume focused work with AI assistance, about **3–4 weeks in total**; the MVP is ready after about 2–2.5 weeks.

| Sprint                                             | Focus                   | Outcome                                                                                                    | Estimate | Status  |
| -------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------- | -------- | ------- |
| [0](docs/sprints/sprint-0-setup.md)                | Setup                   | Monorepo, web and API skeletons, Prisma + SQLite, uploads folder, lint/typecheck/test scripts, seed script | 1 day    | Done    |
| [1](docs/sprints/sprint-1-auth.md)                 | Authentication          | Register, login, logout, protected routes                                                                  | 1–2 days | Done    |
| [2](docs/sprints/sprint-2-projects-editor.md)      | Projects + empty editor | Dashboard CRUD; editor with 3D canvas, grid and camera                                                     | 2 days   | Planned |
| [3](docs/sprints/sprint-3-environment.md)          | Environment             | Floor size and material, walls, interior/exterior presets, lighting                                        | 2 days   | Planned |
| [4](docs/sprints/sprint-4-models.md)               | Models                  | Upload, library panel, GLB loading, placing models on the floor                                            | 2–3 days | Planned |
| [5](docs/sprints/sprint-5-transform-dimensions.md) | Transform + dimensions  | Move/rotate/scale gizmo, snapping, real-world sizing in metres                                             | 2–3 days | Planned |
| [6](docs/sprints/sprint-6-persistence.md)          | Persistence             | Save/load workspaces, autosave, thumbnails (**MVP complete**)                                              | 2 days   | Planned |
| [7](docs/sprints/sprint-7-presentation.md)         | Presentation + polish   | Share link viewer, PNG export, camera presets, built-in models                                             | 2–3 days | Planned |
| [8](docs/sprints/sprint-8-hardening.md)            | Hardening + demo prep   | Bug fixing, performance, manual test pass, demo data, demo script                                          | 2–3 days | Planned |

## 5. Testing

- **Unit tests (Vitest):** scale calculation, scene schema validation, store actions, auth utilities
- No automated end-to-end or API integration tests. API endpoints and complete user flows are checked by hand, using each sprint's acceptance criteria.
- **Manual tests:** a checklist for each requirement (FR1 to FR9), plus a cross-browser smoke test
- **Usability test:** 3 to 5 users (ideally including a designer or landscaper) do scripted tasks; record their time and any issues
- **Performance check:** fps with 50 objects in the scene

## 6. Deployment (local demo)

- Runs on one machine: the SQLite database file, the API on localhost, and the built web app served by the API (or `npm run dev` during development).
- Uploaded models and thumbnails are stored in `apps/api/uploads/`. Built-in models are committed in `apps/api/assets/models/`. Both are served statically under `/files`. There is no cloud storage.
- The Draco decoder is served locally, not from a CDN, so compressed models load without internet.
- The seed script (`npx prisma db seed`) exists from Sprint 0 and grows each sprint. It ends up creating a demo user, registering the built-in models, and adding one or two example projects.
- Environment variables: `DATABASE_URL` (for example `file:./dev.db`), `JWT_SECRET`, `UPLOAD_DIR`.

## 7. Known limitations and future work

Known limitations (deliberate simplifications):

- Objects always stand on the floor (y = 0), so nothing can be stacked, such as a vase on a table, and nothing can be mounted on a wall.
- Rotation is around the vertical axis only, and scaling is always proportional.
- Only GLB is supported as a model format.
- Uploaded files are served without access control, which is acceptable for a local demo.

Ideas for the thesis conclusion: cloud storage and hosting, a larger model catalogue, a measurement tool, importing 2D floor plans, collaboration, an AR preview.

## 8. Thesis documentation alignment

| Thesis chapter            | Source                        |
| ------------------------- | ----------------------------- |
| Introduction and analysis | Sections 1–2                  |
| Design                    | Section 3                     |
| Implementation            | Section 4 + sprint files      |
| Testing                   | Section 5 + sprint test notes |
| Conclusion                | Section 7                     |

Save the diagrams, screenshots and decisions from each sprint (in the "Deliverables" and "Notes" sections of the sprint files) for the thesis.

## 9. Risks

| Risk                                        | Mitigation                                                                                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Large or broken GLB files                   | Size limit, validation, clear error message in the UI                                                                                    |
| Draco-compressed models fail offline        | Serve the Draco decoder locally                                                                                                          |
| Models with arbitrary units or pivot points | Normalize on load: measure the bounding box, centre the model, place it on the floor                                                     |
| Scope creep                                 | Strict out-of-scope list; mark features as MVP or optional                                                                               |
| Time pressure                               | MVP is complete after Sprint 6; in Sprints 7–8, cut the optional items first (undo/redo, PNG export, usability test with external users) |

## 10. Milestones

- **M1:** requirements and design documents done
- **M2:** MVP (auth, projects, environment, models, transforms, save), end of Sprint 6
- **M3:** feature-complete and tested, end of Sprint 8
- **M4:** thesis written and defended
