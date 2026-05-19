// Loaded synchronously in <head> to set data-theme before paint, preventing a flash.
(function applyInitialTheme(): void {
  try {
    const saved = localStorage.getItem('theme');
    const pref = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches === true;
    const resolved = pref === 'system' ? (prefersDark ? 'dark' : 'light') : pref;
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.setAttribute('data-theme-pref', pref);
  } catch {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
