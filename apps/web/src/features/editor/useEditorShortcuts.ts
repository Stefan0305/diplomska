import { useEffect } from 'react';
import { commandForKey, isTypingTarget } from './shortcuts';
import { useEditorStore } from './store';

/** G move · R rotate · S snap · Del delete · Ctrl+D duplicate · Esc deselect. */
export function useEditorShortcuts() {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || isTypingTarget(event.target)) return;
      const command = commandForKey(event);
      if (!command) return;

      // Read the latest state at key time instead of subscribing (no re-renders needed).
      const state = useEditorStore.getState();
      const { selectedObjectId, selectedWallId } = state;

      switch (command) {
        case 'move':
          state.setTransformMode('translate');
          break;
        case 'rotate':
          state.setTransformMode('rotate');
          break;
        case 'toggleSnap':
          state.setSnapEnabled(!state.snapEnabled);
          break;
        case 'delete':
          if (selectedObjectId) state.removeObject(selectedObjectId);
          else if (selectedWallId) state.removeWall(selectedWallId);
          else return;
          break;
        case 'duplicate':
          if (!selectedObjectId) return;
          state.duplicateObject(selectedObjectId);
          break;
        case 'deselect':
          state.clearSelection();
          break;
      }
      event.preventDefault(); // e.g. Ctrl+D would otherwise bookmark the page
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
