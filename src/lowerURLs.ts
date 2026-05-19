import type { Request, Response, NextFunction } from 'express';

/** Express middleware that lowercases incoming URLs so route matching is case-insensitive. */
export default function lowerURLs(req: Request, _res: Response, next: NextFunction): void {
  req.originalUrl = req.originalUrl.toLowerCase();
  req.url = req.url.toLowerCase();
  next();
}
