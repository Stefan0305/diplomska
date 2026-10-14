import { GizmoHelper, GizmoViewport, Grid, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

/**
 * The 3D view. 1 unit = 1 metre; the floor is the XZ plane at y = 0.
 * Sprint 3 adds the floor and walls, Sprint 4 the models.
 */
export function EditorViewport() {
  return (
    <Canvas
      camera={{ position: [8, 7, 9], fov: 45, near: 0.1, far: 1000 }}
      dpr={[1, 2]}
      className="bg-gradient-to-b from-slate-100 to-slate-200"
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 8]} intensity={1.2} />

      <Grid
        infiniteGrid
        cellSize={0.5}
        sectionSize={5}
        cellColor="#cbd5e1"
        sectionColor="#94a3b8"
        fadeDistance={80}
        followCamera={false}
      />

      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        // Keep the camera above the floor and at a sensible distance.
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={1}
        maxDistance={150}
      />

      <GizmoHelper alignment="bottom-right" margin={[64, 64]}>
        <GizmoViewport labelColor="white" axisHeadScale={0.9} />
      </GizmoHelper>
    </Canvas>
  );
}
