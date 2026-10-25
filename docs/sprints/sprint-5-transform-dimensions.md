# Sprint 5: Transforms and real-world dimensions

**Status:** Implemented (awaiting manual test)
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
  - Objects stay on the floor while moving (y is locked to 0). Stacking and wall mounting are known limitations; see `plan.md` section 7. (Later lifted: see "Vertical positioning" in the notes.)
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

- **Real-world scaling method** (thesis): every model's native size `[w, h, d]` is measured from its bounding box when it loads. An object's real size is `native × scale`, with one uniform scale factor. Typing a target size `t` on axis `a` sets `scale = t / native[a]`, so the other two dimensions follow and proportions are kept.
  - _Example:_ a sofa modelled 2.4 × 0.9 × 1.0 m, set to 2.0 m wide → scale = 2.0 / 2.4 ≈ 0.833 → 2.0 × 0.75 × 0.833 m.
  - The helpers are pure and unit tested (`packages/shared/src/sizing.ts`). They reject zero, negative and non-numeric targets and flat axes (native size 0), and clamp the scale to the schema limits (0.001–1000).
- **Gizmo:** drei `TransformControls` attached to the selected object's group.
  - Move mode shows only the floor-plane handles (X, Z, XZ), and rotate mode only the vertical-axis ring. After every change the store receives the position and the yaw, and any height or tilt is reset to 0.
  - The yaw comes from the quaternion with Euler order `YXZ`; reading `rotation.y` directly flips past ±90°.
  - Snapping (on by default, toggle with **S**) uses 0.1 m and 15°. Values typed in the panel are exact.
- **Selection:** click an object to select it (blue outline around its bounding box, padded slightly to avoid z-fighting). Click empty space or the floor, or press **Esc**, to deselect. The gizmo handles the mouse outside React Three Fiber's events, so the click that ends a drag would otherwise deselect or select whatever lies behind it; clicks within 250 ms of a gizmo interaction are ignored.
- **Properties panel** replaces the environment panel while an object is selected:
  - position X/Z in metres (Y is always 0);
  - rotation in degrees, with ±90° buttons;
  - real width, height and depth in metres;
  - "% of original" and a reset-to-original-size button;
  - duplicate and delete.

  Values update live while dragging.

- **Store rules:** objects always stand on the floor (y = 0), angles are wrapped into (−180°, 180°], and the scale is clamped, so every edit leaves a schema-valid scene (unit tested). A duplicate is placed 0.5 m to the side (X and Z) with the same rotation and scale, and is selected.
- **Keyboard shortcuts:** G move · R rotate · S snap · Delete/Backspace delete (the selected object or wall) · Ctrl/Cmd+D duplicate · Esc deselect. They are ignored while typing in a field or when a dialog is open. The mapping is pure and unit tested; browser shortcuts such as Ctrl+R and Ctrl+S are left alone.
- **Undo/redo** (optional; added after the Sprint 8 test pass, at the user's request). Ctrl+Z undoes, and Ctrl+Shift+Z or Ctrl+Y redoes; there are also toolbar buttons.
  - **Snapshots, not commands.** Every scene edit already goes through one store helper (`commit`) and produces a new immutable scene, so the history is simply a list of earlier scenes (references, not copies), limited to 100 steps. There is no per-action undo logic.
  - **One gesture = one step.** A gizmo drag produces dozens of updates; `beginGesture` records the scene once on mouse down, and the updates until `endGesture` skip the history. A click on the gizmo that moved nothing leaves no empty step. Number fields commit once (on Enter or blur), so each typed value is one step. Selection changes are not recorded.
  - **Undo is an edit:** it marks the project unsaved, so autosave stores the restored state. Selections that point at objects or walls missing from the restored scene are cleared.
  - **Limits:** the history lives in the open tab only (cleared on reload or when another project is opened). Deleting a model from the library is not undoable (its file is deleted on the server), so its objects are also removed from every history step.
- **Vertical positioning** (added after the Sprint 8 test pass, at the user's request). Objects can now be raised off the floor, for wall-mounted items such as shelves, pictures or wall lamps, or for a vase on a table. `position[1]` (already in the scene shape, so no data migration) is the height of the object's base; the schema allows 0–20 m (`OBJECT_ELEVATION_MAX`, the same as the wall height limit), and the store clamps to it with `clampElevation`, so nothing goes below the floor. The move gizmo now shows the green Y arrow (snapped to 0.1 m like X/Z); the properties panel has a "Height (Y)" field and a "Put on the floor" button; duplicates keep the height. Placement on surfaces is manual: there is no snapping onto walls or tabletops, which keeps the feature small.
