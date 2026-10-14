# Sprint 3: Environment

**Status:** Done (2026-10-14)
**Depends on:** Sprint 2
**Requirements covered:** FR3, NFR4

## Goal

The user sets up the space they are designing: indoor or outdoor, the floor size in metres, the floor material and simple walls.

## Scope

- **In:** environment settings panel, floor plane, material presets, walls, interior/exterior presets, simple lighting
- **Out:** complex shapes (L-shaped rooms are made from walls), terrain height, doors and windows, realistic textures or shadows

## Tasks (high level)

- **Shared:** Zod schema for the `environment` part of the scene (type, width, depth, floorMaterial, walls[]). Each wall is `{ id, start: [x, z], end: [x, z], height, thickness }`.
- **Web:**
  - Environment panel built with shadcn/ui (`Tabs`, `Input`, `Select`, `Slider`): interior/exterior, width and depth in metres, floor material
  - Floor plane sized in metres (1 unit = 1 m)
  - Material presets with flat colours or simple textures: parquet, tiles, concrete, grass, soil, gravel
  - Walls as simple boxes (start point, end point, height, thickness); add, edit and delete
  - Presets: an "Interior" room with 4 walls, or an "Exterior" garden plot without walls
  - Ambient and directional light; different sky colours for interior and exterior
  - Environment stored in the Zustand store

## Acceptance criteria

- [x] Changing the width or depth updates the floor immediately and the size is shown in metres
- [x] The floor material can be switched between the presets
- [x] Walls can be added, edited and removed
- [x] Choosing the interior or exterior preset sets up a sensible starting space

## Tests

- Unit tests: environment schema validation and store actions for walls

## Deliverables for the thesis

- Screenshots of an interior and an exterior setup
- Short explanation of the coordinate system and units

## Notes / decisions

- **Coordinate system:** the floor is centred on the origin. X is the width, Z the depth, Y points up, and 1 unit is 1 metre. A 6 m wide floor runs from x = −3 to x = 3.
- **Pure environment logic lives in `packages/shared/src/environment.ts`** (presets, perimeter walls, resizing, wall geometry), so it is unit tested and also used by the API for new projects.
- **New projects now start with four walls** (6 × 5 m interior, 2.7 m high, 15 cm thick). Projects created before this sprint keep their empty wall list; switching the environment type adds the preset walls.
- **Resizing scales the walls with the floor:** every wall endpoint is multiplied by newSize / oldSize. Perimeter walls stay on the edges and inner walls keep their relative position; heights and thicknesses don't change.
- **Switching interior/exterior applies a preset** (interior: four perimeter walls + parquet; exterior: no walls + grass) and keeps the floor size. When walls would be replaced, a confirmation dialog appears first.
- **Walls are boxes** between their start and end points, centred on the line. The box is extended by the wall thickness so walls meeting at a corner overlap with no gap. Rotation: `rotationY = −atan2(dz, dx)` (three.js rotates counter-clockwise around +Y, and +Z points towards the viewer).
- **Camera stays above the floor:** panning moves along the floor plane (`screenSpacePanning={false}`) instead of the screen plane, so the orbit target can't drop below the floor. Together with the polar-angle limit, the camera never goes underground. Height is changed by tilting and zooming; vertical panning with limits is planned for Sprint 7.
- **Background experiments reverted:** a shared gray background and a gray ground plane were tried after feedback, then reverted at the user's request. The original per-type background (light gray indoors, blue sky outdoors) and the original grid colours stay.
- **Corner flicker (z-fighting) fixed:** overlapping wall boxes share face planes at corners, and the selected (blue) wall flickered there. The selected wall's material uses `polygonOffset` so it always wins the depth test.
- **Selecting walls:** click a wall in the 3D view or in the list. Clicking the floor or the sky deselects. The selected wall is highlighted blue.
- **Flat colours instead of textures** for the floor materials, consistent with the "no realistic rendering" scope. The metre grid is drawn just above the floor, so scale stays visible on every material.
- **Number inputs commit on Enter or blur** (Escape cancels) and accept a comma as the decimal separator, so typing "12" doesn't briefly resize the room to 1 m. Values are clamped to the schema limits by the store, so the scene is always valid.
- **"Unsaved changes" badge:** edits mark the scene dirty, and saving arrives in Sprint 6. Until then, edits are lost on reload.
