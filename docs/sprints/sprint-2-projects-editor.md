# Sprint 2: Projects and the empty editor

**Status:** Planned
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

- [ ] A user can create, rename, duplicate and delete projects
- [ ] A user cannot open or change another user's project
- [ ] Opening a project shows the 3D viewport with a grid
- [ ] The camera can orbit, pan and zoom with the mouse

## Tests

- Manual check: project CRUD and the ownership check
- Unit tests: default scene creation, ownership check

## Deliverables for the thesis

- ER diagram (User and Project)
- Wireframes of the dashboard and editor
- Screenshot of the empty editor

## Notes / decisions

_Filled in during the sprint._
