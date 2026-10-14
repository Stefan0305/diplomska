import { describe, expect, it } from 'vitest';
import { formatMetres, parseNumberInput } from './number';

describe('parseNumberInput', () => {
  it('parses plain and decimal numbers', () => {
    expect(parseNumberInput('12')).toBe(12);
    expect(parseNumberInput(' 2.75 ')).toBe(2.75);
    expect(parseNumberInput('.5')).toBe(0.5);
    expect(parseNumberInput('-3')).toBe(-3);
  });

  it('accepts a comma as the decimal separator', () => {
    expect(parseNumberInput('2,5')).toBe(2.5);
  });

  it('rejects empty and non-numeric input', () => {
    expect(parseNumberInput('')).toBeNull();
    expect(parseNumberInput('abc')).toBeNull();
    expect(parseNumberInput('1.2.3')).toBeNull();
    expect(parseNumberInput('5m')).toBeNull();
    expect(parseNumberInput('Infinity')).toBeNull();
  });

  it('clamps to the given range', () => {
    expect(parseNumberInput('0', { min: 1, max: 200 })).toBe(1);
    expect(parseNumberInput('500', { min: 1, max: 200 })).toBe(200);
  });
});

describe('formatMetres', () => {
  it('shows at most two decimals without trailing zeros', () => {
    expect(formatMetres(6)).toBe('6 m');
    expect(formatMetres(2.5)).toBe('2.5 m');
    expect(formatMetres(3.14159)).toBe('3.14 m');
  });
});
