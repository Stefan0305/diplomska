import {
  ENVIRONMENT_SIZE_MAX,
  ENVIRONMENT_SIZE_MIN,
  floorMaterials,
  type EnvironmentType,
  type FloorMaterial,
} from '@app/shared';
import { Home, Trees } from 'lucide-react';
import { useState } from 'react';
import { NumberField } from '@/components/NumberField';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { floorMaterialStyles } from '../materials';
import { useEditorStore } from '../store';
import { WallsSection } from './WallsSection';

function MaterialSwatch({ material }: { material: FloorMaterial }) {
  return (
    <span
      className="size-3.5 shrink-0 rounded-sm border border-black/10"
      style={{ backgroundColor: floorMaterialStyles[material].color }}
    />
  );
}

export function EnvironmentPanel() {
  const environment = useEditorStore((s) => s.scene?.environment);
  const setFloorSize = useEditorStore((s) => s.setFloorSize);
  const setFloorMaterial = useEditorStore((s) => s.setFloorMaterial);
  const applyEnvironmentPreset = useEditorStore((s) => s.applyEnvironmentPreset);
  const [pendingType, setPendingType] = useState<EnvironmentType | null>(null);

  if (!environment) return null;
  const { type, width, depth, floorMaterial, walls } = environment;

  function handleTypeChange(next: string) {
    const nextType = next as EnvironmentType;
    if (nextType === type) return;
    // Switching replaces walls and floor material; ask first if there are walls to lose.
    if (walls.length > 0) setPendingType(nextType);
    else applyEnvironmentPreset(nextType);
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <h2 className="text-sm font-medium">Environment</h2>

      <Tabs value={type} onValueChange={handleTypeChange}>
        <TabsList className="w-full">
          <TabsTrigger value="interior">
            <Home />
            Interior
          </TabsTrigger>
          <TabsTrigger value="exterior">
            <Trees />
            Exterior
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium">{type === 'interior' ? 'Room' : 'Plot'} size</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {Number((width * depth).toFixed(1))} m²
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            id="floor-width"
            label="Width (X)"
            unit="m"
            value={width}
            min={ENVIRONMENT_SIZE_MIN}
            max={ENVIRONMENT_SIZE_MAX}
            onCommit={(value) => setFloorSize(value, depth)}
          />
          <NumberField
            id="floor-depth"
            label="Depth (Z)"
            unit="m"
            value={depth}
            min={ENVIRONMENT_SIZE_MIN}
            max={ENVIRONMENT_SIZE_MAX}
            onCommit={(value) => setFloorSize(width, value)}
          />
        </div>
      </div>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="floor-material" className="text-xs">
          Floor material
        </FieldLabel>
        <Select
          value={floorMaterial}
          onValueChange={(value) => setFloorMaterial(value as FloorMaterial)}
        >
          <SelectTrigger id="floor-material" className="h-8 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {floorMaterials.map((material) => (
              <SelectItem key={material} value={material}>
                <MaterialSwatch material={material} />
                {floorMaterialStyles[material].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <WallsSection />

      <AlertDialog
        open={pendingType !== null}
        onOpenChange={(open) => !open && setPendingType(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Switch to {pendingType === 'interior' ? 'an interior' : 'an exterior'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingType === 'interior'
                ? 'Your walls are replaced with four walls around the floor, and the floor becomes parquet.'
                : 'All walls are removed and the floor becomes grass.'}{' '}
              The {type === 'interior' ? 'room' : 'plot'} size stays the same.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingType) applyEnvironmentPreset(pendingType);
                setPendingType(null);
              }}
            >
              Switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
