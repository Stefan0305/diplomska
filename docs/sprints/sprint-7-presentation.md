# Sprint 7: Presentation and polish

**Status:** Planned
**Depends on:** Sprint 6
**Requirements covered:** FR8, FR9, NFR5

## Goal

Designs can be presented to clients: a read-only viewer reached through a share link, preset camera views and screenshot export. The overall UI is polished and comes with a useful set of built-in models.

## Scope

- **In:** share links, read-only viewer, PNG export, camera presets, built-in model set, UX polish
- **Out:** comments or annotations from clients, password-protected sharing, video export

## Tasks (high level)

- **API:**
  - Generate and revoke a share token for a project
  - `GET /api/share/:token` returns the scene and model URLs without requiring login
- **Web:**
  - "Share" dialog (shadcn/ui `Dialog`, `Switch`, copy `Button`) that shows and copies the link, and lets the user disable sharing
  - Viewer route `/view/:token` with orbit controls only: no editing UI and no gizmos
  - Camera presets: top, front and perspective, with "fit the whole scene in view"
  - Vertical camera panning (requested in Sprint 3): right-drag up/down moves the view along Y again, with the orbit target and the camera clamped to y ≥ 0 so the camera never goes below the floor
  - Export the current view as a PNG, reusing the canvas capture helper from Sprint 6
  - UX polish: empty states, loading indicators, error messages, tooltips (shadcn/ui `Tooltip`), `Skeleton` loading states, and a short help dialog with the keyboard shortcuts
- **Built-in models:** about 15–30 free GLB models (furniture, plants, trees, outdoor items) with licence notes, committed in `apps/api/assets/models/` and registered through the seed script

## Acceptance criteria

- [ ] A share link opens the design in a private window without logging in, and nothing can be edited
- [ ] Disabling sharing makes the old link stop working
- [ ] The camera presets and PNG export work in the editor and in the viewer
- [ ] The built-in models are available in the library for every user

## Tests

- Unit test: share token generation
- Manual check: share link access, revoked tokens, no write access through share links; the viewer in Chrome, Firefox and Edge

## Deliverables for the thesis

- Screenshots of the viewer and of exported images
- A list of the built-in models with their sources and licences

## Notes / decisions

_Filled in during the sprint._
