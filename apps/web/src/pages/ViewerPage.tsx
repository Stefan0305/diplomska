import { Eye } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { HelpDialog } from '@/features/editor/HelpDialog';
import { environmentLooks } from '@/features/editor/materials';
import { Floor } from '@/features/editor/scene/Floor';
import { SceneObjects } from '@/features/editor/scene/SceneObjects';
import { SceneStage } from '@/features/editor/scene/SceneStage';
import { Walls } from '@/features/editor/scene/Walls';
import { ViewToolbar } from '@/features/editor/ViewToolbar';
import { useSharedProject } from '@/features/projects/hooks';
import { ApiError } from '@/lib/api';
import { formatRelativeTime } from '@/lib/time';

/**
 * Public, read-only presentation of a shared design: orbit, presets and PNG export only. No
 * selection, gizmos or panels, and nothing is ever sent back to the server.
 */
export function ViewerPage() {
  const { token = '' } = useParams();
  const shared = useSharedProject(token);
  const [helpOpen, setHelpOpen] = useState(false);
  const models = useMemo(
    () => (shared.data ? new Map(shared.data.models.map((m) => [m.id, m])) : undefined),
    [shared.data],
  );

  if (shared.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (shared.isError) {
    const notFound = shared.error instanceof ApiError && shared.error.status === 404;
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-4 px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {notFound
              ? 'This share link does not exist or sharing was turned off by its owner.'
              : shared.error.message}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link to="/">Go to the home page</Link>
        </Button>
      </div>
    );
  }

  const { name, scene, updatedAt } = shared.data;
  const { environment, objects } = scene;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
        <h1 className="truncate text-sm font-medium">{name}</h1>
        <Badge variant="secondary" className="gap-1">
          <Eye />
          View only
        </Badge>
        <span className="ml-auto text-xs text-muted-foreground">
          Saved {formatRelativeTime(updatedAt)}
        </span>
      </div>
      <div className="relative min-h-0 flex-1">
        <SceneStage environment={environment} objects={objects}>
          <Floor environment={environment} />
          <Walls
            walls={environment.walls}
            color={environmentLooks[environment.type].wallColor}
            selectedWallId={null}
          />
          <SceneObjects objects={objects} models={models} selectedObjectId={null} />
        </SceneStage>
        <div className="pointer-events-none absolute bottom-3 left-3">
          <ViewToolbar projectName={name} onHelp={() => setHelpOpen(true)} />
        </div>
      </div>
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} editing={false} />
    </div>
  );
}
