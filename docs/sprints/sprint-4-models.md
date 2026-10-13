# Sprint 4: 3D models

**Status:** Planned
**Depends on:** Sprint 3
**Requirements covered:** FR4, part of FR5, NFR3 (upload validation)

## Goal

Users upload their own GLB models, browse a model library, and place models in the scene, where they appear standing on the floor.

## Scope

- **In:** Model table, file upload to the local folder, library panel, model loading, normalization, placing models
- **Out:** moving, rotating and scaling after placement (Sprint 5); the full built-in model set (Sprint 7, 2–3 test models are enough now); `.gltf` with separate files, OBJ and FBX

## Tasks (high level)

- **API:**
  - `Model` Prisma model: owner (null = built-in), name, category, filePath. Native dimensions are **not** stored.
  - `POST /api/models`: upload with Multer to `apps/api/uploads/`. Accept `.glb` only; check the `glTF` magic bytes and the size (for example 20 MB at most).
  - `GET /api/models` returns built-in models plus the user's own models
  - `DELETE /api/models/:id` deletes the record and the file. Built-in models cannot be deleted.
  - Seed: register 2–3 test models from `apps/api/assets/models/` as built-ins
- **Web:**
  - Library panel (shadcn/ui `Tabs` for categories (furniture, plants, outdoor, decor, other), `Input` search, `ScrollArea`), and an upload `Dialog`
  - Load models with `useGLTF`; serve the Draco decoder files locally (copied into `apps/web/public/draco/`) and point `useGLTF` at them, so compressed models load offline
  - Normalize on load: measure the bounding box, centre the model and put its base at y = 0. Keep the measured native size in memory (a cache keyed by `modelId`) for Sprint 5; do not save it.
  - Clicking a library item adds an object to the scene at the centre of the floor
- **Shared:** schemas for the model metadata and for scene objects

## Acceptance criteria

- [ ] Uploading a valid GLB adds it to the library; invalid or too-large files are rejected with a clear message
- [ ] A placed model stands on the floor, centred, regardless of how it was modelled
- [ ] Users only see built-in models and their own uploads
- [ ] A Draco-compressed GLB loads with the network disconnected
- [ ] Deleting a model removes it from the library and from disk

## Tests

- Unit tests: upload validation rules (extension, magic bytes, size limit) and the bounding-box normalization helper
- Manual check: uploading, listing and deleting models

## Deliverables for the thesis

- Sequence diagram of the upload flow
- Explanation of why GLB was chosen and how models are normalized

## Notes / decisions

_Filled in during the sprint._
