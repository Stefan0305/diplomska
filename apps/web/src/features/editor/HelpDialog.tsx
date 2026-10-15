import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import { mouseControls, shortcutList } from './shortcuts';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The viewer has no editing tools, so it only lists the mouse controls. */
  editing: boolean;
}

export function HelpDialog({ open, onOpenChange, editing }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Controls</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Click a model in the library to place it, then select it to move, rotate or resize it.'
              : 'Look around the design with the mouse. Nothing can be changed here.'}
          </DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {mouseControls.map(({ input, action }) => (
            <div key={input} className="contents">
              <dt className="font-medium">{input}</dt>
              <dd className="text-muted-foreground">{action}</dd>
            </div>
          ))}
          {editing &&
            shortcutList.map(({ keys, action }) => (
              <div key={action} className="contents">
                <dt className="flex items-center gap-1">
                  {keys.map((key, i) => (
                    <span key={key} className="flex items-center gap-1">
                      {i > 0 && '+'}
                      <Kbd>{key}</Kbd>
                    </span>
                  ))}
                </dt>
                <dd className="text-muted-foreground">{action}</dd>
              </div>
            ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
