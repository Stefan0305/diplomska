import { useGLTF } from '@react-three/drei';

/**
 * Draco decoder served by this app (copied from three.js by scripts/copy-draco.mjs).
 * drei's default is a Google CDN, which would break compressed models offline.
 */
export const DRACO_DECODER_PATH = '/draco/';
useGLTF.setDecoderPath(DRACO_DECODER_PATH);

/** Load a GLB (cached by URL; Draco-compressed files are decoded with the local decoder). */
export function useModelGltf(url: string) {
  return useGLTF(url, DRACO_DECODER_PATH);
}
