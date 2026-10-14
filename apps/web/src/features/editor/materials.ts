import type { EnvironmentType, FloorMaterial } from '@app/shared';

/** Flat-colour floor presets: simple on purpose (no textures or realistic rendering). */
export const floorMaterialStyles: Record<FloorMaterial, { label: string; color: string }> = {
  parquet: { label: 'Parquet', color: '#b8895a' },
  tiles: { label: 'Tiles', color: '#d8d3ca' },
  concrete: { label: 'Concrete', color: '#a8a29e' },
  grass: { label: 'Grass', color: '#6b9e4c' },
  soil: { label: 'Soil', color: '#7c5b3d' },
  gravel: { label: 'Gravel', color: '#a19a8f' },
};

/** Background and light settings per environment type. */
export const environmentLooks: Record<
  EnvironmentType,
  { background: string; ambient: number; sun: number; wallColor: string }
> = {
  interior: { background: '#e7e5e4', ambient: 0.75, sun: 0.9, wallColor: '#f5f5f4' },
  exterior: { background: '#bfdbfe', ambient: 0.6, sun: 1.4, wallColor: '#e7e2d9' },
};

export const SELECTED_COLOR = '#60a5fa';
