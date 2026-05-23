import type { Theme } from './types.ts';

const STORAGE_KEY = 'theme';
const THEMES: readonly Theme[] = ['light', 'dark', 'system'] as const;

export function isTheme(v: unknown): v is Theme {
  return typeof v === 'string' && (THEMES as readonly string[]).includes(v);
}

export function readSavedTheme(storage: Pick<Storage, 'getItem'> = localStorage): Theme {
  const saved = storage.getItem(STORAGE_KEY);
  return isTheme(saved) ? saved : 'system';
}

export function resolveTheme(theme: Theme, prefersDark: boolean): 'light' | 'dark' {
  if (theme === 'system') return prefersDark ? 'dark' : 'light';
  return theme;
}

export function nextTheme(current: Theme): Theme {
  const i = THEMES.indexOf(current);
  return THEMES[(i + 1) % THEMES.length] ?? 'system';
}

export function applyTheme(theme: Theme, doc: Document = document, prefersDark?: boolean): 'light' | 'dark' {
  const effectivelyDark =
    typeof prefersDark === 'boolean'
      ? prefersDark
      : typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches === true;
  const resolved = resolveTheme(theme, effectivelyDark);
  doc.documentElement.setAttribute('data-theme', resolved);
  doc.documentElement.setAttribute('data-theme-pref', theme);
  return resolved;
}

export function saveTheme(theme: Theme, storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(STORAGE_KEY, theme);
}
