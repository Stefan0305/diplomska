import { CircleAlert, CircleCheck, CircleDot, Save } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AUTOSAVE_DELAY_MS, type SaveStatus } from './useSceneSaver';

const AUTOSAVE_SECONDS = AUTOSAVE_DELAY_MS / 1000;

const STATUS = {
  saved: {
    icon: <CircleCheck className="text-emerald-600" />,
    label: 'Saved',
    hint: 'All changes are saved.',
  },
  unsaved: {
    icon: <CircleDot className="text-amber-500" />,
    label: 'Pending changes',
    hint: `Saves automatically ${AUTOSAVE_SECONDS} seconds after your last change. Press Ctrl+S to save now.`,
  },
  saving: { icon: <Spinner />, label: 'Saving…', hint: 'Saving your changes.' },
  error: {
    icon: <CircleAlert className="text-destructive" />,
    label: 'Save failed',
    hint: 'Your changes are not saved. Make another change or press Save to try again.',
  },
} satisfies Record<SaveStatus, { icon: ReactNode; label: string; hint: string }>;

interface SaveIndicatorProps {
  status: SaveStatus;
  onSave: () => void;
}

/** Save state badge plus the Save button (autosave runs a few seconds after each edit). */
export function SaveIndicator({ status, onSave }: SaveIndicatorProps) {
  const { icon, label, hint } = STATUS[status];
  return (
    <div className="ml-auto flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1 text-muted-foreground" aria-live="polite">
            {icon}
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{hint}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" onClick={onSave} disabled={status === 'saving'}>
            <Save />
            Save
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Save now <Kbd>Ctrl</Kbd>+<Kbd>S</Kbd> · changes also save automatically
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
