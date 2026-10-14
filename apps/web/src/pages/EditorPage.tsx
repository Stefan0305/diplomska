import { ArrowLeft, CircleDot } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { EditorViewport } from '@/features/editor/EditorViewport';
import { EnvironmentPanel } from '@/features/editor/panels/EnvironmentPanel';
import { useEditorStore } from '@/features/editor/store';
import { useProject } from '@/features/projects/hooks';
import { ApiError } from '@/lib/api';

function PanelPlaceholder({ title, sprint }: { title: string; sprint: number }) {
  return (
    <div className="flex flex-col gap-1 p-4">
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="text-xs text-muted-foreground">Coming in Sprint {sprint}.</p>
    </div>
  );
}

export function EditorPage() {
  const { id = '' } = useParams();
  const project = useProject(id);
  const loadProject = useEditorStore((s) => s.loadProject);
  const reset = useEditorStore((s) => s.reset);
  const projectName = useEditorStore((s) => s.projectName);
  const isDirty = useEditorStore((s) => s.isDirty);

  // Load the fetched project into the editor store; clear it when leaving the editor.
  useEffect(() => {
    if (project.data) loadProject(project.data);
  }, [project.data, loadProject]);
  useEffect(() => reset, [reset]);

  if (project.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (project.isError) {
    const notFound = project.error instanceof ApiError && project.error.status === 404;
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-4 px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {notFound ? 'This project does not exist or is not yours.' : project.error.message}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link to="/projects">Back to projects</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b px-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/projects">
            <ArrowLeft />
            Projects
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <h1 className="truncate text-sm font-medium">{projectName || project.data.name}</h1>
        {isDirty && (
          // Saving arrives in Sprint 6; until then edits live only in this browser tab.
          <Badge variant="outline" className="ml-auto gap-1 text-muted-foreground">
            <CircleDot className="text-amber-500" />
            Unsaved changes (saving comes in Sprint 6)
          </Badge>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r bg-background md:block">
          <PanelPlaceholder title="Model library" sprint={4} />
        </aside>
        <div className="relative min-w-0 flex-1">
          <EditorViewport />
        </div>
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l bg-background lg:block">
          <EnvironmentPanel />
          <Separator />
          <PanelPlaceholder title="Properties" sprint={5} />
        </aside>
      </div>
    </div>
  );
}
