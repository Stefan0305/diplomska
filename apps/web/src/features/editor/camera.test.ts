import { createDefaultScene, createEnvironmentPreset } from '@app/shared';
import { describe, expect, it } from 'vitest';
import { cameraForPreset, clampPanHeight, sceneBounds, TARGET_MAX_HEIGHT } from './camera';

describe('sceneBounds', () => {
  it('covers the floor and the wall height of the default room', () => {
    const { environment } = createDefaultScene();
    const bounds = sceneBounds(environment, []);
    const height = Math.max(...environment.walls.map((w) => w.height));
    expect(bounds.min[1]).toBe(0);
    expect(bounds.max[1]).toBe(height);
    expect(bounds.min[0]).toBeLessThanOrEqual(-environment.width / 2);
    expect(bounds.max[2]).toBeGreaterThanOrEqual(environment.depth / 2);
  });

  it('grows to include objects placed outside the floor', () => {
    const environment = createEnvironmentPreset('exterior', 10, 10);
    const object = {
      id: 'o',
      modelId: 'm',
      position: [20, 0, -1] as [number, number, number],
      rotationY: 0,
      scale: 1,
    };
    const bounds = sceneBounds(environment, [object]);
    expect(bounds.max[0]).toBe(20.5);
    expect(bounds.min[2]).toBe(-5);
  });
});

describe('cameraForPreset', () => {
  const bounds = {
    min: [-5, 0, -4] as [number, number, number],
    max: [5, 2.5, 4] as [number, number, number],
  };

  it('top: looks straight down at the floor centre from above', () => {
    const view = cameraForPreset('top', bounds, 45, 16 / 9);
    expect(view.target).toEqual([0, 0, 0]);
    expect(view.position[0]).toBe(0);
    expect(view.position[1]).toBeGreaterThan(10);
    expect(view.position[2]).toBeCloseTo(0, 2);
  });

  it('front: in front of the scene (+Z), slightly above the target', () => {
    const view = cameraForPreset('front', bounds, 45, 16 / 9);
    expect(view.position[0]).toBe(0);
    expect(view.position[2]).toBeGreaterThan(4);
    expect(view.position[1]).toBeGreaterThan(view.target[1]);
  });

  it('perspective: from the front-right, above the floor', () => {
    const view = cameraForPreset('perspective', bounds, 45, 16 / 9);
    expect(view.position[0]).toBeGreaterThan(0);
    expect(view.position[2]).toBeCloseTo(view.position[0]);
    expect(view.position[1]).toBeGreaterThan(0);
  });

  it('moves further away for a bigger scene and for a narrower canvas', () => {
    const big = {
      min: [-50, 0, -40] as [number, number, number],
      max: [50, 2.5, 40] as [number, number, number],
    };
    const distance = (v: { position: number[]; target: number[] }) =>
      Math.hypot(...v.position.map((p, i) => p - v.target[i]!));
    expect(distance(cameraForPreset('top', big, 45, 1.5))).toBeGreaterThan(
      distance(cameraForPreset('top', bounds, 45, 1.5)),
    );
    expect(distance(cameraForPreset('front', bounds, 45, 0.5))).toBeGreaterThan(
      distance(cameraForPreset('front', bounds, 45, 2)),
    );
  });
});

describe('clampPanHeight', () => {
  it('pushes a target below the floor back up to y = 0', () => {
    expect(clampPanHeight(-1.5)).toBe(1.5);
  });

  it('pulls a target above the limit back down', () => {
    expect(clampPanHeight(TARGET_MAX_HEIGHT + 2)).toBe(-2);
  });

  it('leaves a target in range alone', () => {
    expect(clampPanHeight(0)).toBe(0);
    expect(clampPanHeight(3)).toBe(0);
  });
});
