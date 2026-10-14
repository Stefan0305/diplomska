/** Editor keyboard shortcuts as pure data, so the mapping is unit tested. */
export type EditorCommand = 'move' | 'rotate' | 'toggleSnap' | 'delete' | 'duplicate' | 'deselect';

export interface KeyInput {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

export function commandForKey({ key, ctrlKey, metaKey, altKey }: KeyInput): EditorCommand | null {
  const modifier = ctrlKey || metaKey;
  if (altKey) return null;
  if (modifier) return key.toLowerCase() === 'd' ? 'duplicate' : null;
  switch (key.toLowerCase()) {
    case 'g':
      return 'move';
    case 'r':
      return 'rotate';
    case 's':
      return 'toggleSnap';
    case 'delete':
    case 'backspace':
      return 'delete';
    case 'escape':
      return 'deselect';
    default:
      return null;
  }
}

/** Shortcuts must never fire while the user is typing in a form field. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === 'undefined' || !(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    target.closest('[role="dialog"], [role="alertdialog"], [role="listbox"], [role="menu"]') !==
      null
  );
}
