import { useThree, type RootState } from '@react-three/fiber';
import { useEffect } from 'react';
import type { Object3D } from 'three';

/**
 * Canvas capture for project thumbnails and PNG export.
 *
 * The scene is rendered once more and read back in the same task, so the drawing buffer is
 * still intact and `preserveDrawingBuffer` is not needed. Editing helpers (gizmo, selection
 * outline) are hidden for that one render; the next regular frame shows them again.
 */

/** Set `userData[CAPTURE_HIDDEN]` on objects that must never appear in a capture. */
export const CAPTURE_HIDDEN = 'captureHidden';
/** Set `userData[CAPTURE_GRID]` on the grid, which captures can leave out. */
export const CAPTURE_GRID = 'captureGrid';

let getState: (() => RootState) | null = null;

/** Mount inside <Canvas> to make the view capturable from outside it. */
export function CaptureBridge() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    getState = get;
    return () => {
      if (getState === get) getState = null;
    };
  }, [get]);
  return null;
}

function hideForCapture(object: Object3D, hideGrid: boolean): boolean {
  if (object.userData[CAPTURE_HIDDEN] === true) return true;
  if (hideGrid && object.userData[CAPTURE_GRID] === true) return true;
  // drei's TransformControls is the three-stdlib controls object itself.
  return 'isTransformControls' in object;
}

export interface CaptureOptions {
  /** Output size in px; omitted = the canvas size. The image is cropped to fill it. */
  width?: number;
  height?: number;
  type?: 'image/png' | 'image/jpeg';
  quality?: number;
  hideGrid?: boolean;
}

/** Fit a source rectangle into a target aspect ratio by cropping (like CSS object-fit: cover). */
export function coverCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): { x: number; y: number; width: number; height: number } {
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = targetWidth / scale;
  const height = targetHeight / scale;
  return { x: (sourceWidth - width) / 2, y: (sourceHeight - height) / 2, width, height };
}

/** Returns the current view as a data URL, or null when no 3D view is mounted. */
export function captureView(options: CaptureOptions = {}): string | null {
  if (!getState) return null;
  const { gl, scene, camera } = getState();
  const { type = 'image/png', quality, hideGrid = false } = options;

  const hidden: Object3D[] = [];
  scene.traverse((object) => {
    if (object.visible && hideForCapture(object, hideGrid)) {
      object.visible = false;
      hidden.push(object);
    }
  });
  try {
    gl.render(scene, camera);
    const source = gl.domElement;
    const width = options.width ?? source.width;
    const height = options.height ?? source.height;
    const output = document.createElement('canvas');
    output.width = width;
    output.height = height;
    const context = output.getContext('2d');
    if (!context) return null;
    const crop = coverCrop(source.width, source.height, width, height);
    context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
    return output.toDataURL(type, quality);
  } finally {
    for (const object of hidden) object.visible = true;
  }
}

/** Small JPEG preview for the dashboard. */
export function captureThumbnail(): string | null {
  return captureView({ width: 480, height: 300, type: 'image/jpeg', quality: 0.8 });
}
