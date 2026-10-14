# Sprint 2: Projects and the empty editor

**Status:** Done (2026-10-14)
**Depends on:** Sprint 1
**Requirements covered:** FR2, FR8 (basic camera)

## Goal

A logged-in user manages their projects on a dashboard and opens a project in an editor that shows an empty 3D scene they can look around in.

## Scope

- **In:** Project model, project CRUD, dashboard, editor page layout, 3D canvas with grid and orbit camera
- **Out:** environment settings, models, saving the scene contents (later sprints)

## Tasks (high level)

- **Shared:** Project schemas; an initial scene schema with a default empty scene
- **API:**
  - `Project` Prisma model, owned by a user
  - `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id`, `POST /api/projects/:id/duplicate`
  - Ownership check so users only see their own projects, written as a small pure function so it can be unit tested
- **Web:**
  - Dashboard: shadcn/ui `Card` grid; create and rename in a `Dialog`; actions in a `DropdownMenu`; delete confirmed with an `AlertDialog`
  - Editor route `/projects/:id` with a layout: toolbar, left panel, 3D viewport, right panel
  - R3F `Canvas` with a grid, basic lights and `OrbitControls`
  - Zustand editor store skeleton

## Acceptance criteria

- [x] A user can create, rename, duplicate and delete projects
- [x] A user cannot open or change another user's project
- [x] Opening a project shows the 3D viewport with a grid
- [x] The camera can orbit, pan and zoom with the mouse

## Tests

- Manual check: project CRUD and the ownership check
- Unit tests: default scene creation, ownership check

## Deliverables for the thesis

- ER diagram (User and Project)
- Wireframes of the dashboard and editor
- Screenshot of the empty editor

## Notes / decisions

- **The full scene format is defined now** (`packages/shared/src/scene.ts`, version 1): environment (type, width, depth, floor material, walls) and objects (`position`, `rotationY`, uniform `scale`). New projects start as an empty 6 × 5 m interior. Later sprints fill in behaviour, not the format.
- **Another user's project returns 404, not 403**, so project ids cannot be probed. The check is a pure function (`assertOwnedProject`) and is unit tested.
- **Stored scenes are validated when read as well as when written:** corrupt data causes a server error instead of reaching the editor.
- **Duplicating copies only the scene**, not the thumbnail or the share link. The copy is named "<name> (copy)" and trimmed to fit the 80-character limit.
- **Deleting a user deletes their projects** (`onDelete: Cascade`). The list is sorted by most recently updated, backed by an `(ownerId, updatedAt)` index.
- **The editor is lazy-loaded:** three.js lives in its own chunk (about 250 kB gzipped) and only downloads when a project is opened.
- **Layout:** normal pages use a centred layout; the editor uses a full-height layout under the fixed 3.5rem header.
- **The Zustand store copies the scene** (`structuredClone`) when a project loads, so editing never mutates TanStack Query's cached server data.
- **The `react-hooks/set-state-in-effect` lint rule** led to resetting dialog forms by mounting them inside `DialogContent` (which unmounts when closed) instead of resetting in an effect.
- **Sonner toasts** are used now for action feedback (planned for Sprint 6), pinned to the light theme without `next-themes`.
- **`npm run db:migrate`** runs only `prisma migrate dev`, so `-- --name x` reaches it; `prisma generate` runs as the `postdb:migrate` script.
