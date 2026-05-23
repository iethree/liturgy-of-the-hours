/**
 * Dev-only browser reload via Server-Sent Events.
 *
 *   GET /__dev/ping    → 200 'ok' (sentinel for "is the dev server running?")
 *   GET /__dev/reload  → text/event-stream that emits a `reload` event
 *                        whenever a file in the watched directory changes.
 *
 * Mounted by `src/prayer-app.ts` only when NODE_ENV !== 'production'.
 */

import express, { type Request, type Response, type Router } from 'express';
import { watch, type FSWatcher } from 'node:fs';

interface DevClient {
  res: Response;
  ping: ReturnType<typeof setInterval>;
}

export function createDevReloadRouter(watchDirs: string | string[]): Router {
  const dirs = Array.isArray(watchDirs) ? watchDirs : [watchDirs];
  const router = express.Router();
  const clients = new Set<DevClient>();
  let debounce: ReturnType<typeof setTimeout> | null = null;
  const watchers: FSWatcher[] = [];

  router.get('/__dev/ping', (_req: Request, res: Response) => {
    res.status(200).type('text/plain').send('ok');
  });

  router.get('/__dev/reload', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(': connected\n\n');

    const ping = setInterval(() => {
      try { res.write(': keepalive\n\n'); } catch { /* connection gone */ }
    }, 30_000);

    const client: DevClient = { res, ping };
    clients.add(client);

    req.on('close', () => {
      clearInterval(ping);
      clients.delete(client);
    });
  });

  const broadcast = (): void => {
    for (const c of clients) {
      try {
        c.res.write('event: reload\ndata: 1\n\n');
      } catch {
        // Connection dropped — cleanup will fire on its own.
      }
    }
  };

  for (const dir of dirs) {
    try {
      const w = watch(dir, { recursive: true }, (_event, filename) => {
        if (!filename) return;
        const f = filename.toString();
        if (f.endsWith('.map') || f.startsWith('.')) return;

        // Debounce to coalesce the burst of writes during a bundle rebuild.
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(broadcast, 100);
      });
      watchers.push(w);
      console.log(`[dev] reload watcher armed on ${dir}`);
    } catch (e: unknown) {
      console.warn(`[dev] reload watcher could not start on ${dir}:`, e);
    }
  }

  // Hook into process exit so watchers get a chance to close cleanly.
  process.on('exit', () => watchers.forEach((w) => w.close()));

  return router;
}
