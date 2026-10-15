import { Box, CircleHelp, ImageDown, PanelTop, Square } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { downloadDataUrl, fileNameFor } from '@/lib/download';
import type { CameraPreset } from './camera';
import { captureView } from './capture';
import { setCameraView } from './cameraControl';

const PRESET_BUTTONS: { preset: CameraPreset; label: string; icon: ReactNode }[] = [
  { preset: 'perspective', label: 'Perspective view', icon: <Box /> },
  { preset: 'top', label: 'Top view (floor plan)', icon: <Square /> },
  { preset: 'front', label: 'Front view', icon: <PanelTop /> },
];

function ToolButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={onClick} aria-label={label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

interface ViewToolbarProps {
  /** Used for the exported file name. */
  projectName: string;
  onHelp: () => void;
}

/** Camera presets, PNG export and help: the same in the editor and the viewer. */
export function ViewToolbar({ projectName, onHelp }: ViewToolbarProps) {
  function exportPng() {
    // Full canvas resolution, without the grid and the editing helpers.
    const image = captureView({ type: 'image/png', hideGrid: true });
    if (!image) {
      toast.error('The 3D view is not ready yet');
      return;
    }
    downloadDataUrl(image, fileNameFor(projectName, 'png'));
  }

  return (
    <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border bg-background/95 p-1 shadow-sm backdrop-blur">
      {PRESET_BUTTONS.map(({ preset, label, icon }) => (
        <ToolButton key={preset} label={label} onClick={() => setCameraView(preset)}>
          {icon}
        </ToolButton>
      ))}
      <div className="mx-1 h-5 w-px bg-border" />
      <ToolButton label="Export as PNG image" onClick={exportPng}>
        <ImageDown />
      </ToolButton>
      <ToolButton label="Controls and shortcuts (?)" onClick={onHelp}>
        <CircleHelp />
      </ToolButton>
    </div>
  );
}
