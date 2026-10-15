import type { Environment, SceneObject } from '@app/shared';
import { GizmoHelper, GizmoViewport, Grid, OrbitControls, Stats } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useRef, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import type { PerspectiveCamera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CAPTURE_GRID, CaptureBridge } from '../capture';
import { cameraForPreset, clampPanHeight, sceneBounds, type CameraPreset } from '../camera';
import { registerCameraControl } from '../cameraControl';
import { environmentLooks } from '../materials';

interface CameraRigProps {
  environment: Environment;
  objects: SceneObject[];
}

/**
 * Camera presets and the vertical panning limit. The scene is framed once when the view opens;
 * after that the camera only moves when the user moves it or picks a preset.
 */
function CameraRig({ environment, objects }: CameraRigProps) {
  const get = useThree((s) => s.get);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  // Presets read the latest scene at click time, without re-registering on every edit.
  const sceneRef = useRef({ environment, objects });
  useEffect(() => {
    sceneRef.current = { environment, objects };
  });

  useEffect(() => {
    if (!controls) return;
    const apply = (preset: CameraPreset) => {
      const { camera, size } = get();
      const { environment, objects } = sceneRef.current;
      const fov = (camera as PerspectiveCamera).fov;
      const view = cameraForPreset(
        preset,
        sceneBounds(environment, objects),
        fov,
        size.width / size.height,
      );
      camera.position.set(...view.position);
      controls.target.set(...view.target);
      controls.update();
    };
    apply('perspective');
    return registerCameraControl(apply);
  }, [controls, get]);

  // Panning moves the target in screen space, including up and down. Keep the target between
  // the floor and a height limit by shifting target and camera together; with the polar angle
  // limit, the camera then always stays above the floor.
  useEffect(() => {
    if (!controls) return;
    const clamp = () => {
      const shift = clampPanHeight(controls.target.y);
      if (shift === 0) return;
      controls.target.y += shift;
      controls.object.position.y += shift;
    };
    controls.addEventListener('change', clamp);
    return () => controls.removeEventListener('change', clamp);
  }, [controls]);

  return null;
}

interface SceneStageProps {
  environment: Environment;
  objects: SceneObject[];
  /** A click that hits nothing. */
  onPointerMissed?: () => void;
  children: ReactNode;
}

/**
 * The 3D stage shared by the editor and the read-only viewer: background, lights, metre grid,
 * orbit camera with presets, the axes widget, and canvas capture. 1 unit = 1 metre; the floor
 * is the XZ plane at y = 0, centred on the origin.
 */
export function SceneStage({ environment, objects, onPointerMissed, children }: SceneStageProps) {
  const look = environmentLooks[environment.type];
  // `?fps` in the URL shows an fps counter, for the performance check (NFR2).
  const [searchParams] = useSearchParams();
  const showFps = searchParams.has('fps');
  return (
    <Canvas
      camera={{ position: [8, 7, 9], fov: 45, near: 0.1, far: 1000 }}
      dpr={[1, 2]}
      onPointerMissed={onPointerMissed}
    >
      <color attach="background" args={[look.background]} />
      <ambientLight intensity={look.ambient} />
      <directionalLight position={[10, 15, 8]} intensity={look.sun} />

      {children}

      {/* Metre grid drawn just above the floor so it stays visible on every material. */}
      <Grid
        userData={{ [CAPTURE_GRID]: true }}
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
        // The polar limit keeps the camera above the floor; CameraRig keeps the target there.
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={1}
        maxDistance={250}
      />
      <CameraRig environment={environment} objects={objects} />
      <CaptureBridge />

      {showFps && <Stats />}

      <GizmoHelper alignment="bottom-right" margin={[64, 64]}>
        <GizmoViewport labelColor="white" axisHeadScale={0.9} />
      </GizmoHelper>
    </Canvas>
  );
}
