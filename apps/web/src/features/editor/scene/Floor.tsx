import type { Environment } from '@app/shared';
import { floorMaterialStyles } from '../materials';

interface FloorProps {
  environment: Environment;
  onClick: () => void;
}

/** The floor or garden plot: a flat rectangle of width × depth metres centred on the origin. */
export function Floor({ environment, onClick }: FloorProps) {
  return (
    <mesh
      rotation-x={-Math.PI / 2}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <planeGeometry args={[environment.width, environment.depth]} />
      <meshStandardMaterial color={floorMaterialStyles[environment.floorMaterial].color} />
    </mesh>
  );
}
