import { useModelMap } from '@/features/models/hooks';
import { environmentLooks } from './materials';
import { Floor } from './scene/Floor';
import { isGizmoClick } from './scene/gizmoGuard';
import { SceneObjects } from './scene/SceneObjects';
import { SceneStage } from './scene/SceneStage';
import { Walls } from './scene/Walls';
import { useEditorStore } from './store';

const NO_OBJECTS: never[] = [];

/** The editor's 3D view, rendered from the editor store, with selection and gizmos. */
export function EditorViewport() {
  const environment = useEditorStore((s) => s.scene?.environment);
  const objects = useEditorStore((s) => s.scene?.objects ?? NO_OBJECTS);
  const selectedWallId = useEditorStore((s) => s.selectedWallId);
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId);
  const selectWall = useEditorStore((s) => s.selectWall);
  const selectObject = useEditorStore((s) => s.selectObject);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  // Read outside <Canvas>: hooks that need React context stay in the DOM tree.
  const models = useModelMap();

  // Ignore the click that ends a gizmo drag, so it doesn't change the selection.
  const deselect = () => {
    if (!isGizmoClick()) clearSelection();
  };
  const pickWall = (id: string) => {
    if (!isGizmoClick()) selectWall(id);
  };

  if (!environment) return null;

  return (
    // A click that hits nothing (the sky) clears the selection.
    <SceneStage environment={environment} objects={objects} onPointerMissed={deselect}>
      <Floor environment={environment} onClick={deselect} />
      <Walls
        walls={environment.walls}
        color={environmentLooks[environment.type].wallColor}
        selectedWallId={selectedWallId}
        onSelect={pickWall}
      />
      <SceneObjects
        objects={objects}
        models={models}
        selectedObjectId={selectedObjectId}
        onSelect={selectObject}
      />
    </SceneStage>
  );
}
