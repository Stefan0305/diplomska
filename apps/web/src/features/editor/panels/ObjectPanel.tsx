import {
  normalizeAngle,
  scaledSize,
  scaleForTargetSize,
  toDegrees,
  toRadians,
  type ModelInfo,
  type SceneObject,
  type SizeAxis,
} from '@app/shared';
import { Copy, Maximize2, Trash2, X } from 'lucide-react';
import { NumberField } from '@/components/NumberField';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { categoryInfo } from '@/features/models/categories';
import { useModelSizeStore } from '../models/sizes';
import { useEditorStore } from '../store';

const SIZE_FIELDS: { axis: SizeAxis; label: string }[] = [
  { axis: 0, label: 'Width (X)' },
  { axis: 1, label: 'Height (Y)' },
  { axis: 2, label: 'Depth (Z)' },
];

function SectionTitle({ children }: { children: string }) {
  return <h3 className="text-xs font-medium">{children}</h3>;
}

interface ObjectPanelProps {
  object: SceneObject;
  model: ModelInfo | undefined;
}

/** Position, rotation and real-world size of the selected object. */
export function ObjectPanel({ object, model }: ObjectPanelProps) {
  const updateObject = useEditorStore((s) => s.updateObject);
  const removeObject = useEditorStore((s) => s.removeObject);
  const duplicateObject = useEditorStore((s) => s.duplicateObject);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const nativeSize = useModelSizeStore((s) => s.sizes[object.modelId]);

  const [x, , z] = object.position;
  const realSize = nativeSize ? scaledSize(nativeSize, object.scale) : null;
  const Icon = model ? categoryInfo[model.category].icon : null;

  function resize(axis: SizeAxis, target: number) {
    if (!nativeSize) return;
    const scale = scaleForTargetSize(nativeSize, axis, target);
    if (scale !== null) updateObject(object.id, { scale });
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Icon className="size-4" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium">{model?.name ?? 'Missing model'}</h2>
            <p className="text-xs text-muted-foreground">
              {model ? categoryInfo[model.category].label : 'This model was deleted'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={clearSelection}
          aria-label="Deselect"
        >
          <X />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle>Position</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            id="object-x"
            label="X"
            unit="m"
            value={x}
            onCommit={(value) => updateObject(object.id, { position: [value, 0, z] })}
          />
          <NumberField
            id="object-z"
            label="Z"
            unit="m"
            value={z}
            onCommit={(value) => updateObject(object.id, { position: [x, 0, value] })}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Objects always stand on the floor (Y = 0).
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle>Rotation</SectionTitle>
        <div className="grid grid-cols-2 items-end gap-2">
          <NumberField
            id="object-rotation"
            label="Around Y"
            unit="°"
            decimals={1}
            value={toDegrees(object.rotationY)}
            onCommit={(degrees) => updateObject(object.id, { rotationY: toRadians(degrees) })}
          />
          <div className="flex gap-1">
            {[-90, 90].map((step) => (
              <Button
                key={step}
                variant="outline"
                size="sm"
                className="h-8 flex-1 px-0 text-xs"
                onClick={() =>
                  updateObject(object.id, {
                    rotationY: normalizeAngle(object.rotationY + toRadians(step)),
                  })
                }
              >
                {step > 0 ? '+' : '−'}90°
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <SectionTitle>Real-world size</SectionTitle>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {Number((object.scale * 100).toFixed(1))}% of original
          </span>
        </div>
        {realSize ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {SIZE_FIELDS.map(({ axis, label }) => (
                <NumberField
                  key={axis}
                  id={`object-size-${axis}`}
                  label={label}
                  unit="m"
                  value={realSize[axis]}
                  min={0.001}
                  onCommit={(target) => resize(axis, target)}
                />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Type one dimension; the others follow, so proportions are kept.
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={object.scale === 1}
              onClick={() => updateObject(object.id, { scale: 1 })}
            >
              <Maximize2 />
              Reset to original size
            </Button>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            {model ? 'Measuring the model…' : 'Size unknown: the model is missing.'}
          </p>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={() => duplicateObject(object.id)}>
          <Copy />
          Duplicate
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive"
          onClick={() => removeObject(object.id)}
        >
          <Trash2 />
          Delete
        </Button>
      </div>
    </div>
  );
}
