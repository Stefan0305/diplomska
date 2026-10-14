import { describe, expect, it } from 'vitest';
import { isGizmoClick, markGizmoInteraction } from './gizmoGuard';

describe('gizmo click guard', () => {
  it('treats a click right after a gizmo drag as part of the drag', () => {
    markGizmoInteraction(1000);
    expect(isGizmoClick(1100)).toBe(true);
  });

  it('lets later clicks through', () => {
    markGizmoInteraction(1000);
    expect(isGizmoClick(1300)).toBe(false);
  });
});
