import { describe, expect, it } from 'vitest';
import { commandForKey, type KeyInput } from './shortcuts';

const key = (k: string, mods: Partial<KeyInput> = {}): KeyInput => ({
  key: k,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
});

describe('commandForKey', () => {
  it('maps the gizmo and snap keys (any letter case)', () => {
    expect(commandForKey(key('g'))).toBe('move');
    expect(commandForKey(key('G', { shiftKey: true }))).toBe('move');
    expect(commandForKey(key('r'))).toBe('rotate');
    expect(commandForKey(key('s'))).toBe('toggleSnap');
  });

  it('maps Delete and Backspace to delete, Escape to deselect', () => {
    expect(commandForKey(key('Delete'))).toBe('delete');
    expect(commandForKey(key('Backspace'))).toBe('delete');
    expect(commandForKey(key('Escape'))).toBe('deselect');
  });

  it('maps Ctrl+S and Cmd+S to save (not to the snap toggle)', () => {
    expect(commandForKey(key('s', { ctrlKey: true }))).toBe('save');
    expect(commandForKey(key('S', { metaKey: true }))).toBe('save');
  });

  it('maps Ctrl+D and Cmd+D to duplicate', () => {
    expect(commandForKey(key('d', { ctrlKey: true }))).toBe('duplicate');
    expect(commandForKey(key('D', { metaKey: true }))).toBe('duplicate');
  });

  it('maps ? (Shift+/) to help', () => {
    expect(commandForKey(key('?', { shiftKey: true }))).toBe('help');
  });

  it('leaves other browser shortcuts alone', () => {
    expect(commandForKey(key('r', { ctrlKey: true }))).toBeNull(); // reload
    expect(commandForKey(key('g', { altKey: true }))).toBeNull();
    expect(commandForKey(key('d'))).toBeNull();
    expect(commandForKey(key('x'))).toBeNull();
  });
});
