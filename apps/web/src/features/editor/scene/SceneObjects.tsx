import { toRadians, type ModelInfo, type SceneObject } from '@app/shared';
import { TransformControls } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { Box3, BoxGeometry, EdgesGeometry, Euler, type Group, type Object3D } from 'three';
import { CAPTURE_HIDDEN } from '../capture';
import { SELECTED_COLOR } from '../materials';
import { useModelGltf } from '../models/gltf';
import { normalizeBounds, type Vec3 } from '../models/normalize';
import { useModelSizeStore } from '../models/sizes';
import { useEditorStore } from '../store';
import { isGizmoClick, markGizmoInteraction } from './gizmoGuard';

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

const SNAP_TRANSLATE = 0.1; // metres
const SNAP_ROTATE = toRadians(15);
const PLACEHOLDER_SIZE: Vec3 = [0.5, 0.5, 0.5];
const yawEuler = new Euler(0, 0, 0, 'YXZ');

/** Outline around the selected object's bounding box (slightly padded to avoid z-fighting). */
function SelectionBox({ size }: { size: Vec3 }) {
  const [w, h, d] = size;
  const geometry = useMemo(() => {
    const pad = (v: number) => v * 1.02 + 0.01;
    const box = new BoxGeometry(pad(w), pad(h), pad(d));
    const edges = new EdgesGeometry(box);
    box.dispose();
    return edges;
  }, [w, h, d]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineSegments
      geometry={geometry}
      position={[0, h / 2, 0]}
      raycast={() => null}
      userData={{ [CAPTURE_HIDDEN]: true }}
    >
      <lineBasicMaterial color={SELECTED_COLOR} />
    </lineSegments>
  );
}

interface PlacedObjectProps {
  object: SceneObject;
  model: ModelInfo | undefined;
  selected: boolean;
  onSelect?: (id: string) => void;
}

function PlacedObject({ object, model, selected, onSelect }: PlacedObjectProps) {
  const group = useRef<Group>(null);
  const nativeSize = useModelSizeStore((s) => (model ? s.sizes[model.id] : undefined));
  const transformMode = useEditorStore((s) => s.transformMode);
  const snapEnabled = useEditorStore((s) => s.snapEnabled);
  const updateObject = useEditorStore((s) => s.updateObject);
  const beginGesture = useEditorStore((s) => s.beginGesture);
  const endGesture = useEditorStore((s) => s.endGesture);

  // Gizmo drags write straight back to the store, so the properties panel updates live.
  function handleGizmoChange() {
    const node = group.current;
    if (!node) return;
    // Yaw from the quaternion ("YXZ" order) is stable past ±90°, unlike rotation.y.
    const yaw = yawEuler.setFromQuaternion(node.quaternion, 'YXZ').y;
    // Undo anything the gizmo may add beyond the allowed transform (tilt, height).
    node.rotation.set(0, yaw, 0);
    node.position.y = 0;
    updateObject(object.id, { position: [node.position.x, 0, node.position.z], rotationY: yaw });
  }

  return (
    <>
      <group
        ref={group}
        position={object.position as Vec3}
        rotation-y={object.rotationY}
        scale={object.scale}
        onClick={
          onSelect &&
          ((event: ThreeEvent<MouseEvent>) => {
            event.stopPropagation();
            if (!isGizmoClick()) onSelect(object.id);
          })
        }
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
        {selected && (
          <SelectionBox size={model ? (nativeSize ?? PLACEHOLDER_SIZE) : PLACEHOLDER_SIZE} />
        )}
      </group>
      {selected && (
        <TransformControls
          object={group as RefObject<Object3D>}
          mode={transformMode}
          // Move along the floor only; rotate around the vertical axis only.
          showY={transformMode === 'rotate'}
          showX={transformMode === 'translate'}
          showZ={transformMode === 'translate'}
          translationSnap={snapEnabled ? SNAP_TRANSLATE : null}
          rotationSnap={snapEnabled ? SNAP_ROTATE : null}
          size={0.8}
          onObjectChange={handleGizmoChange}
          // One drag = one undo step.
          onMouseDown={() => {
            markGizmoInteraction();
            beginGesture();
          }}
          onMouseUp={() => {
            markGizmoInteraction();
            endGesture();
          }}
        />
      )}
    </>
  );
}

interface SceneObjectsProps {
  objects: SceneObject[];
  /** undefined while the model library is still loading. */
  models: Map<string, ModelInfo> | undefined;
  selectedObjectId: string | null;
  /** Omitted in the read-only viewer: nothing can be selected there. */
  onSelect?: (id: string) => void;
}

export function SceneObjects({ objects, models, selectedObjectId, onSelect }: SceneObjectsProps) {
  if (!models) return null;
  return objects.map((object) => (
    <PlacedObject
      key={object.id}
      object={object}
      model={models.get(object.modelId)}
      selected={object.id === selectedObjectId}
      onSelect={onSelect}
    />
  ));
}
