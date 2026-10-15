# Sprint 7: Presentation and polish

**Status:** Implemented (awaiting manual test)
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

- **Share tokens.** `POST /api/projects/:id/share` creates a token of 24 random bytes (`crypto.randomBytes`) in base64url, 32 URL-safe characters, about 192 bits, so links cannot be guessed. Sharing again while a link exists keeps the same link. `DELETE /api/projects/:id/share` clears the token, so the old link returns 404 at once; sharing again creates a new token. The token is stored in the existing unique `Project.shareToken` column, and both routes use the normal owner check.
- **Public read model.** `GET /api/share/:token` needs no login and returns only `{ name, updatedAt, scene, models }`: no owner, ids of other projects or edit routes. Malformed tokens are rejected before the database is queried. The response lists only the models the scene uses; they may be the owner's private uploads, which the viewer needs in order to draw the design. The link shows the last saved version, so the editor saves pending edits when the Share dialog opens.
- **No write path through a share link.** The share router has a single GET route. Saving still requires the owner's session cookie (an anonymous `PUT` gets 401, another user gets 404).
- **One 3D stage for the editor and the viewer.** `SceneStage` holds the background, lights, grid, orbit camera, presets, axes widget and capture bridge. The editor adds selection and gizmos as children; the viewer passes no click handlers, so nothing can be selected (and no raycasting happens on click).
- **Camera presets** (perspective, top, front) are pure maths (`cameraForPreset`). They frame the scene's bounds: floor, walls and objects, using the vertical field of view and the canvas aspect ratio. The view jumps without animation (out of scope). Both the editor and the viewer open in the perspective preset, framed to the scene.
- **Vertical panning** (requested in Sprint 3): OrbitControls pans in screen space again, so right-drag up and down moves the view along Y. On every change the orbit target is clamped to 0–30 m height by shifting the target and the camera together (`clampPanHeight`). With the polar-angle limit, the camera can never go below the floor.
- **PNG export** reuses `captureView` from Sprint 6 at full canvas resolution, without the grid, gizmo and selection outline. The file is named after the project (`fileNameFor`, accents removed).
- **Built-in models: generated, not downloaded.** Instead of collecting 15–30 third-party GLBs with mixed licences, the set is modelled in code (`scripts/catalog.ts`, gltf-transform): 23 low-poly items in four categories (10 furniture, 2 decor, 6 plants, 5 outdoor), at real-world size with the base on y = 0. They are project-owned (no licence questions), tiny (2–57 KB each) and work offline. Users can still upload detailed models from any source. The licence table is in `apps/api/assets/models/README.md`.
- **Help.** A Controls dialog (the ? button or the ? key) lists the mouse controls, plus the keyboard shortcuts in the editor. Both come from one list in `shortcuts.ts`, next to the key mapping.

### Built-in models (for the thesis appendix)

| Model                | Size W × H × D (m) | Category  |
| -------------------- | ------------------ | --------- |
| Sofa                 | 2.00 × 0.85 × 0.90 | furniture |
| Armchair             | 0.85 × 0.85 × 0.85 | furniture |
| Dining chair         | 0.45 × 0.92 × 0.50 | furniture |
| Dining table         | 1.60 × 0.75 × 0.90 | furniture |
| Coffee table         | 1.00 × 0.45 × 0.60 | furniture |
| Double bed           | 1.60 × 1.00 × 2.10 | furniture |
| Wardrobe             | 1.20 × 2.00 × 0.63 | furniture |
| Bookshelf            | 0.80 × 1.80 × 0.30 | furniture |
| TV cabinet (with TV) | 1.60 × 1.32 × 0.40 | furniture |
| Desk                 | 1.20 × 0.75 × 0.60 | furniture |
| Floor lamp           | 0.40 × 1.60 × 0.40 | decor     |
| Rug                  | 2.00 × 0.01 × 1.40 | decor     |
| Potted plant         | 0.60 × 1.18 × 0.53 | plants    |
| Shrub                | 1.00 × 0.80 × 0.92 | plants    |
| Hedge                | 2.00 × 1.20 × 0.60 | plants    |
| Terracotta planter   | 0.60 × 0.90 × 0.60 | plants    |
| Deciduous tree       | 3.84 × 5.86 × 3.84 | plants    |
| Pine tree            | 2.60 × 7.00 × 2.60 | plants    |
| Garden bench         | 1.50 × 0.80 × 0.51 | outdoor   |
| Raised garden bed    | 1.20 × 0.55 × 0.80 | outdoor   |
| Parasol              | 2.50 × 2.40 × 2.50 | outdoor   |
| Fence panel          | 2.00 × 1.20 × 0.08 | outdoor   |
| Stepping stone       | 0.50 × 0.05 × 0.38 | outdoor   |

The four test models from Sprint 4 (off-centre table, plant, 1 m reference cube, Draco tree) stay in the library because they check normalization and scaling.
