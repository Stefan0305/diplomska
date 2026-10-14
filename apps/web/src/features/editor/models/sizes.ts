import { create } from 'zustand';
import type { Vec3 } from './normalize';

/**
 * Native size of each model, measured in the browser when it loads (never stored in the
 * database). Sprint 5 multiplies it by an object's scale to show real-world dimensions.
 */
interface ModelSizeState {
  sizes: Record<string, Vec3>;
  setSize: (modelId: string, size: Vec3) => void;
}

export const useModelSizeStore = create<ModelSizeState>()((set) => ({
  sizes: {},
  setSize: (modelId, size) =>
    set((state) => {
      const current = state.sizes[modelId];
      if (current && current.every((v, i) => v === size[i])) return state; // no re-render
      return { sizes: { ...state.sizes, [modelId]: size } };
    }),
}));
