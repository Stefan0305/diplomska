/**
 * The transform gizmo handles the mouse itself, outside React Three Fiber's event system.
 * Releasing a drag therefore also arrives as a click on whatever is behind the gizmo (the
 * floor, another object, or nothing), which would change or clear the selection mid-edit.
 * Clicks that happen right after a gizmo interaction are ignored.
 */
const GUARD_MS = 250;
let lastGizmoInteraction = -Infinity;

export function markGizmoInteraction(now = performance.now()): void {
  lastGizmoInteraction = now;
}

export function isGizmoClick(now = performance.now()): boolean {
  return now - lastGizmoInteraction < GUARD_MS;
}
