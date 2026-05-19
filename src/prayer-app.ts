import express, { type ErrorRequestHandler, type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import morgan from 'morgan';
import nunjucks from 'nunjucks';
import lowerURLs from './lowerURLs.ts';
import router from './prayer-index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

export function createApp(): express.Express {
  const app = express();

  app.use(morgan('dev'));

  const viewsDir = path.join(PROJECT_ROOT, 'views');
  nunjucks.configure(viewsDir, {
    autoescape: true,
    express: app,
    noCache: process.env.NODE_ENV !== 'production',
  });
  app.set('views', viewsDir);
  app.set('view engine', 'njk');

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(express.static(path.join(PROJECT_ROOT, 'public'), { index: false }));
  app.use(lowerURLs);
  app.use('/', router);

  app.use((_req: Request, res: Response, _next: NextFunction) => {
    res.redirect('/');
  });

  const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    const status = typeof (err as { status?: number }).status === 'number' ? (err as { status: number }).status : 500;
    const message = err instanceof Error ? err.message : 'Server error';
    const isDev = req.app.get('env') === 'development';
    res.status(status);
    res.render('error', { error: isDev ? `${message}\n${err instanceof Error ? err.stack ?? '' : ''}` : message });
  };
  app.use(errorHandler);

  return app;
}

const isMain = typeof Bun !== 'undefined' && import.meta.main;
if (isMain) {
  const PORT = Number(process.env.PORT ?? 3001);
  createApp().listen(PORT, () => {
    console.log(`prayer app on port http://localhost:${PORT}`);
  });
}
