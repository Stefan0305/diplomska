import type { CameraPreset } from './camera';

/** Set by the mounted 3D view (CameraRig), so toolbars outside the Canvas can move the camera. */
let applyPreset: ((preset: CameraPreset) => void) | null = null;

export function registerCameraControl(apply: (preset: CameraPreset) => void): () => void {
  applyPreset = apply;
  return () => {
    if (applyPreset === apply) applyPreset = null;
  };
}

/** Move the camera of the mounted 3D view to a preset that frames the whole scene. */
export function setCameraView(preset: CameraPreset): void {
  applyPreset?.(preset);
}
