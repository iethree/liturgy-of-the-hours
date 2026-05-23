/**
 * Wipes every CacheStorage entry on the page-load thread. Complements the
 * service worker's own cache-clearing on activate, so even browsers that
 * haven't yet picked up the new SW will lose their stale cached assets.
 *
 * Does *not* touch service-worker registration — we still need a registered
 * SW for the Push API.
 */
export async function clearCacheStorage(): Promise<void> {
  try {
    if ('caches' in self) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch {
    /* ignore */
  }
}
