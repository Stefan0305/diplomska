import type { SaveSceneInput } from '@app/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { saveScene } from '@/features/projects/api';
import { projectKeys } from '@/features/projects/hooks';
import { captureThumbnail } from './capture';
import { useEditorStore } from './store';

export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';

/** Autosave runs this long after the last edit. */
export const AUTOSAVE_DELAY_MS = 5000;

export interface SaveOptions {
  /** Manual saves (button, Ctrl+S) show a toast; autosaves stay quiet unless they fail. */
  manual?: boolean;
  /** Leaving the editor: the 3D view may already be gone, so no thumbnail. */
  withThumbnail?: boolean;
}

/**
 * Saving the editor scene: explicit saves, a debounced autosave, a save when leaving the
 * editor, and a browser warning before closing the tab with unsaved changes.
 */
export function useSceneSaver() {
  const queryClient = useQueryClient();
  const isDirty = useEditorStore((s) => s.isDirty);
  const revision = useEditorStore((s) => s.revision);
  // The revision whose save failed: autosave waits for a newer edit before retrying.
  const [failedRevision, setFailedRevision] = useState<number | null>(null);
  const inFlight = useRef(false);

  // A mutation, so the global handler still treats a 401 as logged out.
  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, input }: { id: string; input: SaveSceneInput }) => saveScene(id, input),
  });

  const save = useCallback(
    async ({ manual = false, withThumbnail = true }: SaveOptions = {}) => {
      // One save at a time; a pending autosave runs again afterwards if still needed.
      if (inFlight.current) return;
      const { projectId, scene, revision } = useEditorStore.getState();
      if (!projectId || !scene) return;

      inFlight.current = true;
      try {
        const thumbnail = withThumbnail ? (captureThumbnail() ?? undefined) : undefined;
        await mutateAsync({ id: projectId, input: { scene, thumbnail } });
        // The user may have left (or opened another project) while the request was running.
        if (useEditorStore.getState().projectId === projectId) {
          useEditorStore.getState().markSaved(revision);
        }
        setFailedRevision(null);
        void queryClient.invalidateQueries({ queryKey: projectKeys.list() });
        if (manual) toast.success('Project saved');
      } catch (error) {
        setFailedRevision(revision);
        toast.error('Could not save the project', {
          description: error instanceof Error ? error.message : undefined,
        });
      } finally {
        inFlight.current = false;
      }
    },
    [mutateAsync, queryClient],
  );

  // Debounced autosave: every edit restarts the timer.
  useEffect(() => {
    // isPending is a dependency so edits made during a save get their own autosave after it.
    if (!isDirty || isPending || failedRevision === revision) return;
    const timer = window.setTimeout(() => void save(), AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isDirty, isPending, revision, failedRevision, save]);

  // Closing or reloading the tab with unsaved changes asks for confirmation. The listener reads
  // the store at that moment, so it never depends on an effect having re-run in time.
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!useEditorStore.getState().isDirty) return;
      event.preventDefault();
      // Older browsers (and some current ones) only show the dialog when returnValue is set.
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  /** Call before the editor unmounts: saves pending edits without waiting for autosave. */
  const saveOnExit = useCallback(() => {
    if (useEditorStore.getState().isDirty) void save({ withThumbnail: false });
  }, [save]);

  const status: SaveStatus = isPending
    ? 'saving'
    : failedRevision === revision && isDirty
      ? 'error'
      : isDirty
        ? 'unsaved'
        : 'saved';

  return { save, saveOnExit, status };
}
