# Sprint 4: 3D models

**Status:** Done (2026-10-14)
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

- [x] Uploading a valid GLB adds it to the library; invalid or too-large files are rejected with a clear message
- [x] A placed model stands on the floor, centred, regardless of how it was modelled
- [x] Users only see built-in models and their own uploads
- [x] A Draco-compressed GLB loads with the network disconnected
- [x] Deleting a model removes it from the library and from disk

## Tests

- Unit tests: upload validation rules (extension, magic bytes, size limit) and the bounding-box normalization helper
- Manual check: uploading, listing and deleting models

## Deliverables for the thesis

- Sequence diagram of the upload flow
- Explanation of why GLB was chosen and how models are normalized

## Notes / decisions

- **Why GLB:** a single binary file holds the geometry, materials and textures. It is the web's standard 3D format (three.js loads it natively), it is compact, and it is easy to validate. `.gltf` with separate `.bin` and texture files would need multi-file uploads, and OBJ/FBX lack standard materials or need heavy loaders.
- **Generated, licence-free test models** (`npm run models:generate -w @app/api`, checked with `models:check`): a 1.2 × 0.75 × 0.8 m table deliberately modelled off-centre and 40 cm below the origin, a plant (0.85 m), a 1 m reference cube, and a Draco-compressed 5 m tree. They are committed in `apps/api/assets/models/` and listed in `models.json`, which the seed reads. Real models come in Sprint 7.
- **Upload validation, three layers:**
  - `.glb` extension, size between 1 byte and 20 MB (Multer limit → 413);
  - the 12-byte GLB header: magic `glTF`, version 2, and a declared length equal to the file size, which rejects renamed or truncated files;
  - name and category validated by the shared Zod schema.

  The same file checks run in the browser before uploading, for instant feedback.

- **Storage:** the server names uploaded files with a random UUID (`uploads/models/<uuid>.glb`); the user's file name is never used as a path, and `resolveUploadPath` refuses anything outside the uploads folder. Uploads are held in memory (max 20 MB), validated, and only then written to disk. If the database insert fails, the file is removed again.
- **Paths:** `Model.filePath` is relative to its root. Built-ins (`ownerId = null`) are served from `/files/models/…` (committed assets), uploads from `/files/uploads/…`.
- **Visibility and deletion:** users see all built-ins plus their own uploads. Deleting a built-in returns 403; another user's model returns 404 (no id probing). Deleting removes both the database row and the file. Objects using the model are removed from the open scene; other projects show a red wireframe placeholder.
- **Normalization** (`normalizeBounds`): when a model loads, its bounding box gives an offset that centres it on X/Z and puts its lowest point at y = 0. The offset is applied on a wrapper group, so the model's own root transform is kept. The measured native size goes into an in-memory store (`useModelSizeStore`) for Sprint 5 and is never saved.
- **Draco offline:** drei's `useGLTF` downloads the Draco decoder from Google's CDN by default. The app points it at `/draco/`, a copy of three.js's own decoder made by `apps/web/scripts/copy-draco.mjs` on `npm install` (git-ignored, always matching the installed three.js).
- **Robust rendering:** each placed model renders inside a Suspense boundary and an error boundary, so a model that is loading or broken never blanks the whole 3D view. Clones share geometry and materials with the loader cache.
- **Placing:** clicking a library item adds an object at the floor centre (`position [0, 0, 0]`, no rotation, scale 1) and selects it. The scene allows at most 500 objects (schema limit).
- **Seed** is idempotent: built-ins are upserted by file path, and built-ins removed from `models.json` are deleted from the database.
