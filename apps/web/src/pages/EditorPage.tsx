import { ArrowLeft, Share2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { EditorViewport } from '@/features/editor/EditorViewport';
import { HelpDialog } from '@/features/editor/HelpDialog';
import { MissingModelsAlert } from '@/features/editor/MissingModelsAlert';
import { EnvironmentPanel } from '@/features/editor/panels/EnvironmentPanel';
import { ObjectPanel } from '@/features/editor/panels/ObjectPanel';
import { SaveIndicator } from '@/features/editor/SaveIndicator';
import { useEditorStore } from '@/features/editor/store';
import { TransformToolbar } from '@/features/editor/TransformToolbar';
import { useEditorShortcuts } from '@/features/editor/useEditorShortcuts';
import { useSceneSaver } from '@/features/editor/useSceneSaver';
import { ViewToolbar } from '@/features/editor/ViewToolbar';
import { useModelMap } from '@/features/models/hooks';
import { ModelLibraryPanel } from '@/features/models/ModelLibraryPanel';
import { useProject } from '@/features/projects/hooks';
import { ShareDialog } from '@/features/projects/ShareDialog';
import { ApiError } from '@/lib/api';

export function EditorPage() {
  const { id = '' } = useParams();
  const project = useProject(id);
  const loadProject = useEditorStore((s) => s.loadProject);
  const reset = useEditorStore((s) => s.reset);
  const projectName = useEditorStore((s) => s.projectName);
  const objects = useEditorStore((s) => s.scene?.objects);
  const removeMissingObjects = useEditorStore((s) => s.removeMissingObjects);
  const selectedObject = useEditorStore((s) =>
    s.selectedObjectId ? s.scene?.objects.find((o) => o.id === s.selectedObjectId) : undefined,
  );
  const models = useModelMap();
  const { save, saveOnExit, status } = useSceneSaver();
  const [helpOpen, setHelpOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  useEditorShortcuts({
    onSave: () => void save({ manual: true }),
    onHelp: () => setHelpOpen(true),
  });

  // Load the fetched project into the editor store once; from then on the store owns the scene.
  useEffect(() => {
    if (project.data && useEditorStore.getState().projectId !== project.data.id) {
      loadProject(project.data);
    }
  }, [project.data, loadProject]);
  // Leaving the editor: save pending edits first (this reads the store), then clear it. The ref
  // keeps this cleanup tied to unmounting only, never to a changed callback.
  const saveOnExitRef = useRef(saveOnExit);
  useEffect(() => {
    saveOnExitRef.current = saveOnExit;
  });
  useEffect(
    () => () => {
      saveOnExitRef.current();
      reset();
    },
    [reset],
  );

  // Objects whose model was deleted since the scene was saved.
  const missingCount = useMemo(
    () => (models && objects ? objects.filter((o) => !models.has(o.modelId)).length : 0),
    [models, objects],
  );

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
        <SaveIndicator status={status} onSave={() => void save({ manual: true })} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // The link shows the saved version, so save pending edits first.
            if (useEditorStore.getState().isDirty) void save();
            setShareOpen(true);
          }}
        >
          <Share2 />
          Share
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
          <ModelLibraryPanel />
        </aside>
        <div className="relative min-w-0 flex-1">
          <EditorViewport />
          <TransformToolbar />
          <div className="pointer-events-none absolute bottom-3 left-3">
            <ViewToolbar
              projectName={projectName || project.data.name}
              onHelp={() => setHelpOpen(true)}
            />
          </div>
          {missingCount > 0 && models && (
            <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2">
              <MissingModelsAlert
                count={missingCount}
                onRemove={() => removeMissingObjects(new Set(models.keys()))}
              />
            </div>
          )}
        </div>
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l bg-background lg:block">
          {/* The selected object's properties replace the environment settings while selected. */}
          {selectedObject ? (
            <ObjectPanel
              key={selectedObject.id}
              object={selectedObject}
              model={models?.get(selectedObject.modelId)}
            />
          ) : (
            <EnvironmentPanel />
          )}
        </aside>
      </div>

      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} editing />
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        projectId={project.data.id}
        shareToken={project.data.shareToken}
      />
    </div>
  );
}
