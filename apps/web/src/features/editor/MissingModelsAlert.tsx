import { TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface MissingModelsAlertProps {
  count: number;
  onRemove: () => void;
}

/** Objects whose model was deleted after the scene was saved; they show as red placeholders. */
export function MissingModelsAlert({ count, onRemove }: MissingModelsAlertProps) {
  return (
    <Alert className="pointer-events-auto w-auto max-w-md bg-background/95 shadow-sm">
      <TriangleAlert />
      <AlertDescription className="flex items-center gap-3">
        <span>
          {count === 1 ? '1 object uses a model' : `${count} objects use models`} that no longer
          exist (red boxes).
        </span>
        <Button size="sm" variant="outline" onClick={onRemove}>
          Remove
        </Button>
      </AlertDescription>
    </Alert>
  );
}
