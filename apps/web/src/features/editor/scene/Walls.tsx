import { wallTransform, type Wall } from '@app/shared';
import { SELECTED_COLOR } from '../materials';

interface WallsProps {
  walls: Wall[];
  color: string;
  selectedWallId: string | null;
  /** Omitted in the read-only viewer. */
  onSelect?: (id: string) => void;
}

/** Each wall is a plain box between its start and end points, standing on the floor. */
export function Walls({ walls, color, selectedWallId, onSelect }: WallsProps) {
  return walls.map((wall) => {
    const { position, rotationY, size } = wallTransform(wall);
    const selected = wall.id === selectedWallId;
    return (
      <mesh
        key={wall.id}
        position={position}
        rotation-y={rotationY}
        onClick={
          onSelect &&
          ((event) => {
            event.stopPropagation();
            onSelect(wall.id);
          })
        }
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={selected ? SELECTED_COLOR : color}
          emissive={selected ? SELECTED_COLOR : '#000000'}
          emissiveIntensity={selected ? 0.25 : 0}
          // Walls overlap at corners (closing the gap), so their faces share planes there.
          // Without an offset the depth test flips between the two walls every frame
          // (z-fighting), which flickers once the selected wall has a different colour.
          // Pulling the selected wall slightly towards the camera makes it always win.
          polygonOffset={selected}
          polygonOffsetFactor={selected ? -1 : 0}
          polygonOffsetUnits={selected ? -4 : 0}
        />
      </mesh>
    );
  });
}
