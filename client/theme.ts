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

/** Wire up an in-page toggle button. Safe to call at script-load time. */
export function installThemeToggle(doc: Document = document): void {
  const button = doc.getElementById('theme-toggle');
  if (!button) return;

  const refresh = (theme: Theme): void => {
    applyTheme(theme, doc);
    // Accessibility labels still describe the active preference so screen
    // readers stay informative even though the button is icon-only.
    button.setAttribute('aria-label', `Theme: ${theme}`);
    button.setAttribute('title', `Theme: ${theme} (click to change)`);
  };

  refresh(readSavedTheme());

  button.addEventListener('click', () => {
    const updated = nextTheme(readSavedTheme());
    saveTheme(updated);
    refresh(updated);
  });

  const media = window.matchMedia?.('(prefers-color-scheme: dark)');
  media?.addEventListener('change', () => {
    if (readSavedTheme() === 'system') refresh('system');
  });
}
