import { describe, test, expect } from 'bun:test';
import {
  isTheme,
  readSavedTheme,
  resolveTheme,
  nextTheme,
  themeLabel,
  themeIcon,
} from '../client/theme.ts';

function memStorage(initial: Record<string, string> = {}): Pick<Storage, 'getItem' | 'setItem'> {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
  };
}

describe('theme helpers', () => {
  test('isTheme accepts only valid theme strings', () => {
    expect(isTheme('light')).toBe(true);
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('system')).toBe(true);
    expect(isTheme('purple')).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
  });

  test('readSavedTheme falls back to "system" when nothing is stored', () => {
    expect(readSavedTheme(memStorage())).toBe('system');
  });

  test('readSavedTheme returns the saved preference', () => {
    expect(readSavedTheme(memStorage({ theme: 'dark' }))).toBe('dark');
  });

  test('readSavedTheme falls back when the stored value is invalid', () => {
    expect(readSavedTheme(memStorage({ theme: 'neon' }))).toBe('system');
  });

  test('resolveTheme honors explicit preferences', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  test('resolveTheme follows system preference when set to "system"', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  test('nextTheme cycles light → dark → system → light', () => {
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('system');
    expect(nextTheme('system')).toBe('light');
  });

  test('themeLabel returns "auto" for system', () => {
    expect(themeLabel('light')).toBe('light');
    expect(themeLabel('dark')).toBe('dark');
    expect(themeLabel('system')).toBe('auto');
  });

  test('themeIcon returns a non-empty glyph for each theme', () => {
    for (const t of ['light', 'dark', 'system'] as const) {
      const icon = themeIcon(t);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
    }
  });
});
