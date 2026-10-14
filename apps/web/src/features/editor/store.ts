import type { ProjectDetail, Scene } from '@app/shared';
import { create } from 'zustand';

/**
 * Live editor state. React Three Fiber components render from it and editing actions write to
 * it; saving (Sprint 6) serializes `scene`. Later sprints add environment and object actions.
 */
export interface EditorState {
  projectId: string | null;
  projectName: string;
  scene: Scene | null;
  selectedObjectId: string | null;

  loadProject: (project: ProjectDetail) => void;
  selectObject: (id: string | null) => void;
  reset: () => void;
}

const initialState = {
  projectId: null,
  projectName: '',
  scene: null,
  selectedObjectId: null,
} satisfies Partial<EditorState>;

export const useEditorStore = create<EditorState>()((set) => ({
  ...initialState,

  loadProject: (project) =>
    set({
      projectId: project.id,
      projectName: project.name,
      scene: structuredClone(project.scene),
      selectedObjectId: null,
    }),

  selectObject: (id) => set({ selectedObjectId: id }),

  reset: () => set(initialState),
}));
