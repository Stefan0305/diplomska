import type { ModelInfo, SceneObject } from '@app/shared';
import type { ThreeEvent } from '@react-three/fiber';
import { Component, Suspense, useEffect, useMemo, type ReactNode } from 'react';
import { Box3 } from 'three';
import { useModelGltf } from '../models/gltf';
import { normalizeBounds, type Vec3 } from '../models/normalize';
import { useModelSizeStore } from '../models/sizes';

/** Red wireframe cube: a model that is missing (deleted) or failed to load. */
function Placeholder() {
  return (
    <mesh position={[0, 0.25, 0]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshBasicMaterial color="#ef4444" wireframe />
    </mesh>
  );
}

/** Keeps one broken model from taking down the whole 3D view. */
class ModelErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Failed to load a model', error);
  }

  render() {
    return this.state.failed ? <Placeholder /> : this.props.children;
  }
}

/** The loaded GLB, centred on X/Z and standing on y = 0 (see normalizeBounds). */
function NormalizedModel({ model }: { model: ModelInfo }) {
  const gltf = useModelGltf(model.url);
  const setSize = useModelSizeStore((s) => s.setSize);

  const { object, offset, size } = useMemo(() => {
    // One clone per placed object; geometry and materials stay shared with the cache.
    const object = gltf.scene.clone(true);
    object.updateMatrixWorld(true);
    const box = new Box3().setFromObject(object);
    return { object, ...normalizeBounds({ min: box.min.toArray(), max: box.max.toArray() }) };
  }, [gltf.scene]);

  // Native size is kept in memory for real-world sizing (Sprint 5); never saved.
  useEffect(() => setSize(model.id, size), [model.id, size, setSize]);

  // The offset goes on a wrapper group, so the model's own root transform is preserved.
  return (
    <group position={offset}>
      <primitive object={object} />
    </group>
  );
}

interface SceneObjectsProps {
  objects: SceneObject[];
  /** undefined while the model library is still loading. */
  models: Map<string, ModelInfo> | undefined;
  onSelect: (id: string) => void;
}

export function SceneObjects({ objects, models, onSelect }: SceneObjectsProps) {
  if (!models) return null;
  return objects.map((object) => {
    const model = models.get(object.modelId);
    const handleClick = (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      onSelect(object.id);
    };
    return (
      <group
        key={object.id}
        position={object.position as Vec3}
        rotation-y={object.rotationY}
        scale={object.scale}
        onClick={handleClick}
      >
        {model ? (
          <ModelErrorBoundary>
            <Suspense fallback={null}>
              <NormalizedModel model={model} />
            </Suspense>
          </ModelErrorBoundary>
        ) : (
          <Placeholder />
        )}
      </group>
    );
  });
}
