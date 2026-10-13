# Sprint 5: Transforms and real-world dimensions

**Status:** Planned
**Depends on:** Sprint 4
**Requirements covered:** FR5, FR6, NFR4

## Goal
Users select placed objects and move, rotate and resize them. Sizes are shown and entered in real-world metres, and scaling keeps the model's proportions.

## Scope
- **In:** selection, move/rotate gizmo, snapping, properties panel, proportional scaling to a target size, delete and duplicate
- **Out:** free (non-proportional) scaling, rotation around the X and Z axes, grouping objects, undo/redo (optional extra if time allows)

## Tasks (high level)
- **Web:**
  - Click an object to select it (highlighted outline or bounding box); click empty space to deselect
  - `TransformControls` with move and rotate modes; keyboard shortcuts (for example G for move, R for rotate, Delete)
  - Snapping: move in 0.1 m steps (can be turned on and off), rotate in 15° steps
  - Objects stay on the floor while moving (y is locked to 0). Stacking and wall mounting are known limitations; see `plan.md` section 7.
  - Properties panel (shadcn/ui `Input`, `Label`, `Separator`; `Toggle` for snapping): name, position (m), rotation (°, converted to and from radians), current width, height and depth (m) = native size × `scale`
  - Proportional resize: the user types a target width, height or depth in metres, and `scale = target / native` for that axis is applied uniformly
  - Delete and duplicate the selected object
  - All changes go through the Zustand store. Each object stores `position: [x, y, z]`, `rotationY` (radians) and `scale` (one number).
- **Shared:** a helper that calculates the scale factor from native size and target size

## Acceptance criteria
- [ ] Objects can be selected, moved and rotated with the gizmo, and snapping works
- [ ] The properties panel shows correct real-world dimensions in metres
- [ ] Entering a target dimension (for example a 2.0 m wide sofa) resizes the model proportionally to exactly that size
- [ ] Delete and duplicate work on the selected object

## Tests
- Unit tests: scale-factor calculation (edge cases: zero or negative input, rounding), store actions for transforms

## Deliverables for the thesis
- Explanation of the real-world scaling method, with a formula and an example
- Screenshot of the editor with the properties panel

## Notes / decisions
_Filled in during the sprint._
