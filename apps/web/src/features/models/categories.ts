import type { ModelCategory } from '@app/shared';
import { Box, Lamp, Sofa, Sprout, Trees, type LucideIcon } from 'lucide-react';

export const categoryInfo: Record<ModelCategory, { label: string; icon: LucideIcon }> = {
  furniture: { label: 'Furniture', icon: Sofa },
  plants: { label: 'Plants', icon: Sprout },
  outdoor: { label: 'Outdoor', icon: Trees },
  decor: { label: 'Decor', icon: Lamp },
  other: { label: 'Other', icon: Box },
};

/** "1.2 MB", "350 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Number((bytes / 1024 / 1024).toFixed(1))} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
