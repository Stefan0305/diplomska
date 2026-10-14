import {
  WALL_HEIGHT_MAX,
  WALL_HEIGHT_MIN,
  WALL_THICKNESS_MAX,
  WALL_THICKNESS_MIN,
  wallLength,
  type Wall,
} from '@app/shared';
import { Plus, Trash2 } from 'lucide-react';
import { NumberField } from '@/components/NumberField';
import { Button } from '@/components/ui/button';
import { formatMetres } from '@/lib/number';
import { cn } from '@/lib/utils';
import { useEditorStore } from '../store';

function WallEditor({ wall }: { wall: Wall }) {
  const updateWall = useEditorStore((s) => s.updateWall);
  const removeWall = useEditorStore((s) => s.removeWall);
  const update = (patch: Parameters<typeof updateWall>[1]) => updateWall(wall.id, patch);

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3">
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          id="wall-start-x"
          label="Start X"
          unit="m"
          value={wall.start[0]}
          onCommit={(x) => update({ start: [x, wall.start[1]] })}
        />
        <NumberField
          id="wall-start-z"
          label="Start Z"
          unit="m"
          value={wall.start[1]}
          onCommit={(z) => update({ start: [wall.start[0], z] })}
        />
        <NumberField
          id="wall-end-x"
          label="End X"
          unit="m"
          value={wall.end[0]}
          onCommit={(x) => update({ end: [x, wall.end[1]] })}
        />
        <NumberField
          id="wall-end-z"
          label="End Z"
          unit="m"
          value={wall.end[1]}
          onCommit={(z) => update({ end: [wall.end[0], z] })}
        />
        <NumberField
          id="wall-height"
          label="Height"
          unit="m"
          value={wall.height}
          min={WALL_HEIGHT_MIN}
          max={WALL_HEIGHT_MAX}
          onCommit={(height) => update({ height })}
        />
        <NumberField
          id="wall-thickness"
          label="Thickness"
          unit="m"
          value={wall.thickness}
          min={WALL_THICKNESS_MIN}
          max={WALL_THICKNESS_MAX}
          onCommit={(thickness) => update({ thickness })}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Length {formatMetres(wallLength(wall))}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => removeWall(wall.id)}
        >
          <Trash2 />
          Delete wall
        </Button>
      </div>
    </div>
  );
}

// Stable fallback: a new [] on every call would make the store selector re-render forever.
const NO_WALLS: Wall[] = [];

export function WallsSection() {
  const walls = useEditorStore((s) => s.scene?.environment.walls ?? NO_WALLS);
  const selectedWallId = useEditorStore((s) => s.selectedWallId);
  const selectWall = useEditorStore((s) => s.selectWall);
  const addWall = useEditorStore((s) => s.addWall);
  const selectedWall = walls.find((wall) => wall.id === selectedWallId);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Walls ({walls.length})</span>
        <Button variant="outline" size="sm" onClick={() => addWall()}>
          <Plus />
          Add wall
        </Button>
      </div>

      {walls.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No walls. Add one, or click a wall in the view to edit it.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {walls.map((wall, index) => (
            <li key={wall.id}>
              <button
                type="button"
                onClick={() => selectWall(wall.id === selectedWallId ? null : wall.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted',
                  wall.id === selectedWallId && 'bg-muted font-medium',
                )}
              >
                <span>Wall {index + 1}</span>
                <span className="text-muted-foreground tabular-nums">
                  {formatMetres(wallLength(wall))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Keyed by id so the inputs reset when another wall is selected. */}
      {selectedWall && <WallEditor key={selectedWall.id} wall={selectedWall} />}
    </div>
  );
}
