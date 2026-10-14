import { GizmoHelper, GizmoViewport, Grid, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useModelMap } from '@/features/models/hooks';
import { environmentLooks } from './materials';
import { Floor } from './scene/Floor';
import { isGizmoClick } from './scene/gizmoGuard';
import { SceneObjects } from './scene/SceneObjects';
import { Walls } from './scene/Walls';
import { useEditorStore } from './store';

/**
 * The 3D view, rendered from the editor store. 1 unit = 1 metre; the floor is the XZ plane
 * at y = 0, centred on the origin.
 */
export function EditorViewport() {
  const environment = useEditorStore((s) => s.scene?.environment);
  const objects = useEditorStore((s) => s.scene?.objects);
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
  const look = environmentLooks[environment.type];

  return (
    <Canvas
      camera={{ position: [8, 7, 9], fov: 45, near: 0.1, far: 1000 }}
      dpr={[1, 2]}
      // A click that hits nothing (the sky) clears the selection.
      onPointerMissed={deselect}
    >
      <color attach="background" args={[look.background]} />
      <ambientLight intensity={look.ambient} />
      <directionalLight position={[10, 15, 8]} intensity={look.sun} />

      <Floor environment={environment} onClick={deselect} />
      <Walls
        walls={environment.walls}
        color={look.wallColor}
        selectedWallId={selectedWallId}
        onSelect={pickWall}
      />
      <SceneObjects
        objects={objects ?? []}
        models={models}
        selectedObjectId={selectedObjectId}
        onSelect={selectObject}
      />

      {/* Metre grid drawn just above the floor so it stays visible on every material. */}
      <Grid
        position={[0, 0.002, 0]}
        infiniteGrid
        cellSize={0.5}
        sectionSize={5}
        cellColor="#64748b"
        sectionColor="#334155"
        cellThickness={0.6}
        sectionThickness={1}
        fadeDistance={80}
        followCamera={false}
      />

      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        // Pan along the floor plane instead of the screen plane, so the orbit target stays at
        // floor level; with the polar limit the camera can never go below the floor.
        screenSpacePanning={false}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={1}
        maxDistance={250}
      />

      <GizmoHelper alignment="bottom-right" margin={[64, 64]}>
        <GizmoViewport labelColor="white" axisHeadScale={0.9} />
      </GizmoHelper>
    </Canvas>
  );
}
