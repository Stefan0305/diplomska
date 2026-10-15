import { Magnet, Move, Redo2, RotateCw, Undo2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorStore, type TransformMode } from './store';

function Hint({
  label,
  shortcut,
  children,
}: {
  label: string;
  shortcut: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        {label} <Kbd>{shortcut}</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}

/** Floating toolbar over the 3D view: gizmo mode (move / rotate) and snapping. */
export function TransformToolbar() {
  const transformMode = useEditorStore((s) => s.transformMode);
  const setTransformMode = useEditorStore((s) => s.setTransformMode);
  const snapEnabled = useEditorStore((s) => s.snapEnabled);
  const setSnapEnabled = useEditorStore((s) => s.setSnapEnabled);
  const hasSelection = useEditorStore((s) => s.selectedObjectId !== null);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);

  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-3">
      <div className="pointer-events-auto flex items-center gap-1 rounded-lg border bg-background/95 p-1 shadow-sm backdrop-blur">
        <ToggleGroup
          type="single"
          size="sm"
          value={transformMode}
          // Radix sends "" when the active item is clicked again; keep the current mode then.
          onValueChange={(value) => value && setTransformMode(value as TransformMode)}
          aria-label="Gizmo mode"
        >
          <Hint label="Move" shortcut="G">
            <ToggleGroupItem value="translate" aria-label="Move">
              <Move />
            </ToggleGroupItem>
          </Hint>
          <Hint label="Rotate" shortcut="R">
            <ToggleGroupItem value="rotate" aria-label="Rotate">
              <RotateCw />
            </ToggleGroupItem>
          </Hint>
        </ToggleGroup>
        <div className="mx-1 h-5 w-px bg-border" />
        <Hint label="Snap to 0.1 m and 15°" shortcut="S">
          <Toggle
            size="sm"
            pressed={snapEnabled}
            onPressedChange={setSnapEnabled}
            aria-label="Snapping"
          >
            <Magnet />
            Snap
          </Toggle>
        </Hint>
        <div className="mx-1 h-5 w-px bg-border" />
        {/* A disabled button gets no pointer events, so the tooltip sits on a wrapper span. */}
        <Hint label="Undo" shortcut="Ctrl+Z">
          <span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={undo}
              disabled={!canUndo}
              aria-label="Undo"
            >
              <Undo2 />
            </Button>
          </span>
        </Hint>
        <Hint label="Redo" shortcut="Ctrl+Shift+Z">
          <span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={redo}
              disabled={!canRedo}
              aria-label="Redo"
            >
              <Redo2 />
            </Button>
          </span>
        </Hint>
      </div>

      <p className="pointer-events-auto rounded-md bg-background/90 px-2 py-1 text-[11px] text-muted-foreground shadow-sm">
        {hasSelection ? (
          <>
            Drag the gizmo · <Kbd>Del</Kbd> delete · <Kbd>Ctrl</Kbd>+<Kbd>D</Kbd> duplicate ·{' '}
            <Kbd>Esc</Kbd> deselect
          </>
        ) : (
          'Click an object to select it'
        )}
      </p>
    </div>
  );
}
