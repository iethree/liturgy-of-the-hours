/** Stable per-browser id, generated once and persisted to localStorage. */
export function getId(): string {
  const existing = localStorage.getItem('id');
  if (existing) return existing;
  const id = String(Date.now());
  localStorage.setItem('id', id);
  return id;
}

/**
 * Tear down anything left from the old service worker / cache-based deploys:
 * unregister every SW for this origin and delete every CacheStorage entry.
 * Safe to call on every page load — both APIs no-op when there's nothing
 * to clean up.
 */
export async function tearDownServiceWorkers(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    }
  } catch {
    /* ignore */
  }
  try {
    if ('caches' in self) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch {
    /* ignore */
  }
}
