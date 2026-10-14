/**
 * Parse what the user typed into a number field. Accepts "," as the decimal separator
 * (common in Europe) and clamps to [min, max]. Returns null for anything that isn't a number.
 */
export function parseNumberInput(
  text: string,
  { min = -Infinity, max = Infinity }: { min?: number; max?: number } = {},
): number | null {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '' || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.min(max, Math.max(min, value));
}

/** "6.5 m", "12 m": at most 2 decimals, no trailing zeros. */
export function formatMetres(value: number, decimals = 2): string {
  return `${Number(value.toFixed(decimals))} m`;
}
