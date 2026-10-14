import { createDefaultScene, type ProjectDetail } from '@app/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from './store';

const project: ProjectDetail = {
  id: 'p1',
  name: 'Living room',
  createdAt: '2026-10-13T10:00:00.000Z',
  updatedAt: '2026-10-13T11:00:00.000Z',
  thumbnailUrl: null,
  scene: createDefaultScene(),
};

describe('editor store', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('starts empty', () => {
    const state = useEditorStore.getState();
    expect(state.projectId).toBeNull();
    expect(state.scene).toBeNull();
  });

  it('loads a project and clears any previous selection', () => {
    useEditorStore.getState().selectObject('old');
    useEditorStore.getState().loadProject(project);

    const state = useEditorStore.getState();
    expect(state.projectId).toBe('p1');
    expect(state.projectName).toBe('Living room');
    expect(state.scene).toEqual(project.scene);
    expect(state.selectedObjectId).toBeNull();
  });

  it('copies the scene, so editing it never mutates the cached server data', () => {
    useEditorStore.getState().loadProject(project);
    useEditorStore.getState().scene?.objects.push({
      id: 'o1',
      modelId: 'm1',
      position: [0, 0, 0],
      rotationY: 0,
      scale: 1,
    });
    expect(project.scene.objects).toEqual([]);
  });

  it('selects and deselects objects', () => {
    useEditorStore.getState().selectObject('o1');
    expect(useEditorStore.getState().selectedObjectId).toBe('o1');
    useEditorStore.getState().selectObject(null);
    expect(useEditorStore.getState().selectedObjectId).toBeNull();
  });

  it('resets to the initial state when leaving the editor', () => {
    useEditorStore.getState().loadProject(project);
    useEditorStore.getState().reset();
    expect(useEditorStore.getState().projectId).toBeNull();
    expect(useEditorStore.getState().scene).toBeNull();
  });
});
