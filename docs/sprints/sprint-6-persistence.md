# Sprint 6: Saving and loading workspaces

**Status:** Implemented (awaiting manual test)
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

- **One save request.** `PUT /api/projects/:id/scene` takes `{ scene, thumbnail? }` as JSON. The scene is validated with the shared `sceneSchema` (the only definition of the format) and stored as a string in `Project.scene`. The thumbnail is a base64 data URL in the same request, so a save is a single step and either succeeds or fails as a whole. `GET /api/projects/:id/scene` returns the stored scene. Both routes use the same ownership check as the rest of the projects API (a foreign project is reported as 404).
- **Thumbnail validation.** The data URL must be JPEG or PNG (Zod regex, at most 1 MB), and the server also checks the decoded bytes' file signature, since the prefix alone proves nothing. Thumbnails are written as `uploads/thumbnails/<uuid>.jpg|png`. Every save writes a new file name and deletes the old file, so browsers never show a cached old preview. Deleting a project deletes its thumbnail; duplicates start without one.
- **Capturing the canvas.** Instead of `preserveDrawingBuffer: true` (which costs performance on every frame), `captureView` renders the scene once more and reads the pixels in the same task, while the drawing buffer is still intact. The gizmo and the selection outline are hidden for that one render. The image is cropped to 480 × 300 (cover) and encoded as JPEG (quality 0.8, roughly 20–40 KB). Sprint 7's PNG export reuses `captureView`.
- **Save state.** The store counts edits (`revision`). A save remembers the revision it sent, and on success `markSaved(revision)` clears `isDirty` only if no edit happened in the meantime, so changes made during a slow save are never marked as saved.
- **Autosave** runs 5 s after the last edit (each edit restarts the timer). A failed save is not retried in a loop: autosave waits for the next edit, and the indicator shows "Save failed" until then. Manual saves (button, Ctrl+S) show a toast; autosaves only report errors. Ctrl+S also works inside a number field: it blurs the field first, which commits the typed value.
- **Leaving the editor.** In-app navigation saves pending edits on unmount (without a thumbnail, since the 3D view is being removed). Closing or reloading the tab with unsaved changes shows the browser's confirmation dialog (`beforeunload`).
- **No background refetch.** The project query in the editor has `staleTime: Infinity`, `gcTime: 0` and no refetch on focus: once loaded, the editor store owns the scene, and a refetch would overwrite unsaved edits. Each visit fetches it fresh.
- **Deleted models.** Objects whose model no longer exists still load (the scene stays valid) and render as red wireframe placeholders. An alert in the 3D view counts them and offers to remove them all.

### Scene JSON example (format version 1)

```json
{
  "version": 1,
  "environment": {
    "type": "interior",
    "width": 6,
    "depth": 5,
    "floorMaterial": "parquet",
    "walls": [
      { "id": "w1", "start": [-3, -2.5], "end": [3, -2.5], "height": 2.6, "thickness": 0.15 }
    ]
  },
  "objects": [
    { "id": "o1", "modelId": "cm…", "position": [1.5, 0, -2], "rotationY": 0.5236, "scale": 1.25 }
  ]
}
```

Units are metres and radians; `position[1]` is always 0 because objects stand on the floor.

### Sequence: saving a scene

1. Edit (or Ctrl+S / Save) → store `revision` + 1, `isDirty = true`
2. After 5 s idle → `captureThumbnail()` → `PUT /api/projects/:id/scene { scene, thumbnail }`
3. API: `requireAuth` → Zod `saveSceneInputSchema` → ownership check → decode and check the image → write the thumbnail file → `UPDATE Project SET scene, thumbnail` → delete the old thumbnail
4. Response `{ project }` → `markSaved(revision)` → refresh the dashboard list

### MVP review (milestone M2)

FR1–FR7 are implemented: accounts, project management, environment, model library, placement and transforms, real-world sizing, and saving/loading. FR8 (camera presets) and FR9 (sharing and PNG export) follow in Sprint 7.
