/** Editor keyboard shortcuts as pure data, so the mapping is unit tested. */
export type EditorCommand =
  'move' | 'rotate' | 'toggleSnap' | 'delete' | 'duplicate' | 'deselect' | 'save' | 'help';

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
  if (modifier) {
    const letter = key.toLowerCase();
    if (letter === 'd') return 'duplicate';
    if (letter === 's') return 'save';
    return null;
  }
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
    case '?':
      return 'help';
    default:
      return null;
  }
}

/** Shown in the help dialog; keep in sync with commandForKey. */
export const shortcutList: { keys: string[]; action: string }[] = [
  { keys: ['G'], action: 'Move tool' },
  { keys: ['R'], action: 'Rotate tool' },
  { keys: ['S'], action: 'Snapping on/off (0.1 m, 15°)' },
  { keys: ['Ctrl', 'D'], action: 'Duplicate the selected object' },
  { keys: ['Del'], action: 'Delete the selected object or wall' },
  { keys: ['Esc'], action: 'Deselect' },
  { keys: ['Ctrl', 'S'], action: 'Save now' },
  { keys: ['?'], action: 'Show this help' },
];

/** Mouse controls of the 3D view (editor and viewer). */
export const mouseControls: { input: string; action: string }[] = [
  { input: 'Left drag', action: 'Orbit around the scene' },
  { input: 'Right drag', action: 'Pan (also up and down; never below the floor)' },
  { input: 'Wheel', action: 'Zoom' },
];

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
