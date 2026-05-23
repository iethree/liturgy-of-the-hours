import express, { type ErrorRequestHandler, type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import morgan from 'morgan';
import lowerURLs from './lowerURLs.ts';
import router from './prayer-index.ts';
import { createDevReloadRouter } from './dev-reload.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const IS_PROD = process.env.NODE_ENV === 'production';

export function createApp(): express.Express {
  const app = express();

  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Dev-only browser reload — must mount before the SPA fallback so its routes
  // aren't swallowed by the catch-all.
  if (!IS_PROD) {
    app.use(createDevReloadRouter([
      path.join(PROJECT_ROOT, 'public', 'js'),
      path.join(PROJECT_ROOT, 'public', 'stylesheets'),
    ]));
  }

  // Static assets first — CSS, the SPA bundle, the service worker, images.
  // `index: false` ensures the router's SPA fallback handles `/`.
  app.use(express.static(path.join(PROJECT_ROOT, 'public'), { index: false }));

  app.use(lowerURLs);
  app.use('/', router);

  // JSON error handler — everything is an API now.
  const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    const status = typeof (err as { status?: number }).status === 'number' ? (err as { status: number }).status : 500;
    const message = err instanceof Error ? err.message : 'Server error';
    const isDev = req.app.get('env') === 'development';
    res.status(status).json({
      error: message,
      ...(isDev && err instanceof Error ? { stack: err.stack } : {}),
    });
  };
  app.use(errorHandler);

  return app;
}

const isMain = typeof Bun !== 'undefined' && import.meta.main;
if (isMain) {
  const PORT = Number(process.env.PORT ?? 3001);
  createApp().listen(PORT, () => {
    console.log(`prayer app on port ${PORT}`);
  });
}
