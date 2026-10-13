# Sprint 6: Saving and loading workspaces

**Status:** Planned
**Depends on:** Sprint 5
**Requirements covered:** FR7. This completes the **MVP (milestone M2)**.

## Goal
Workspaces are saved to the database and load exactly as they were left, so a design can be continued at any time.

## Scope
- **In:** saving and loading the scene, validation, autosave, unsaved-changes indicator, project thumbnails
- **Out:** version history, exporting or importing scene files

## Tasks (high level)
- **Shared:** the complete scene Zod schema with a `version` field
- **API:**
  - `GET /api/projects/:id/scene` and `PUT /api/projects/:id/scene`
  - Validate the scene with Zod before saving; store it as a JSON string in `Project.scene`
  - Accept a thumbnail image and save it to the uploads folder
- **Web:**
  - Save button plus a Ctrl+S shortcut
  - Debounced autosave (for example 5 s after the last change)
  - "Unsaved changes" / "Saved" indicator and save notifications (shadcn/ui `Sonner` toast), and a warning before leaving the page with unsaved changes
  - Load the scene into the store when the editor opens
  - Capture a thumbnail from the canvas on save; show thumbnails on the dashboard. The canvas needs `preserveDrawingBuffer: true` (or it must capture right after a render), otherwise the image is blank. Sprint 7's PNG export reuses this capture helper.
  - Handle models that were deleted since the scene was saved (show a placeholder or skip them)

## Acceptance criteria
- [ ] After saving and reloading the page, the scene is identical (environment, objects, positions, rotations, sizes)
- [ ] Autosave works and the save state indicator is accurate
- [ ] Invalid scene data is rejected by the API
- [ ] The dashboard shows a thumbnail for each saved project

## Tests
- Unit tests: scene schema (valid and invalid examples)
- Unit test: serialize/parse round trip of the scene (store, then JSON string, then store)
- Manual check: save and reload; requests from non-owners are rejected

## Deliverables for the thesis
- Description of the scene JSON format, with an example
- Sequence diagram of saving a scene
- MVP review: which requirements are complete

## Notes / decisions
_Filled in during the sprint._
