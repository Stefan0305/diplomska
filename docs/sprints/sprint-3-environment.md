# Sprint 3: Environment

**Status:** Planned
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

- [ ] Changing the width or depth updates the floor immediately and the size is shown in metres
- [ ] The floor material can be switched between the presets
- [ ] Walls can be added, edited and removed
- [ ] Choosing the interior or exterior preset sets up a sensible starting space

## Tests

- Unit tests: environment schema validation and store actions for walls

## Deliverables for the thesis

- Screenshots of an interior and an exterior setup
- Short explanation of the coordinate system and units

## Notes / decisions

_Filled in during the sprint._
