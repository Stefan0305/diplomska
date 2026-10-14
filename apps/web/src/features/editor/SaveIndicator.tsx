import { CircleAlert, CircleCheck, CircleDot, Save } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SaveStatus } from './useSceneSaver';

const STATUS = {
  saved: { icon: <CircleCheck className="text-emerald-600" />, label: 'Saved' },
  unsaved: { icon: <CircleDot className="text-amber-500" />, label: 'Unsaved changes' },
  saving: { icon: <Spinner />, label: 'Saving…' },
  error: { icon: <CircleAlert className="text-destructive" />, label: 'Save failed' },
} satisfies Record<SaveStatus, { icon: ReactNode; label: string }>;

interface SaveIndicatorProps {
  status: SaveStatus;
  onSave: () => void;
}

/** Save state badge plus the Save button (autosave runs a few seconds after each edit). */
export function SaveIndicator({ status, onSave }: SaveIndicatorProps) {
  const { icon, label } = STATUS[status];
  return (
    <div className="ml-auto flex items-center gap-2">
      <Badge variant="outline" className="gap-1 text-muted-foreground" aria-live="polite">
        {icon}
        {label}
      </Badge>
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
