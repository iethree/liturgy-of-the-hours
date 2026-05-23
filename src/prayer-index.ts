import express, { type Request, type Response, type Router } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from './logger.ts';
import { parts } from './parts.ts';
import { getHour } from './hours.ts';
import { count } from './count.ts';
import { getLectionary } from './lectionary.ts';
import { bible } from './bible.ts';
import { format } from './time.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const INDEX_HTML = path.join(PUBLIC_DIR, 'index.html');

const router: Router = express.Router();

function dateParam(req: Request): string | undefined {
  const raw = req.params['date'];
  return raw ? format.numerical(raw) : undefined;
}

function normalizeSeason(s: string): string {
  return s.toLowerCase().replace(/\s/g, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// API endpoints — every response is JSON. The frontend SPA consumes these.
// ─────────────────────────────────────────────────────────────────────────────

router.get('/api/season/:date?', async (req: Request, res: Response) => {
  try {
    const lect = await getLectionary(dateParam(req));
    res.json({ season: normalizeSeason(lect.season) });
  } catch (e: unknown) {
    log.warn('season lookup failed', e);
    res.status(500).json({ season: 'ordinarytime' });
  }
});

router.get('/api/lectionary/:date?', async (req: Request, res: Response) => {
  try {
    const result = await getLectionary(dateParam(req));
    res.json(result);
  } catch (e: unknown) {
    log.err(e);
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

// Today's office — no date in the URL.
router.get('/api/hour/:hour', async (req: Request, res: Response) => {
  try {
    const result = await getHour(req.params['hour']!);
    res.json(result);
  } catch (e: unknown) {
    log.err(e);
    res.status(404).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

// Specific-date office — date precedes hour so the URL reads chronologically.
router.get('/api/hour/:date/:hour', async (req: Request, res: Response) => {
  try {
    const date = format.numerical(req.params['date']);
    const result = await getHour(req.params['hour']!, date);
    res.json(result);
  } catch (e: unknown) {
    log.err(e);
    res.status(404).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

router.get('/api/collect/:date?', async (req: Request, res: Response) => {
  try {
    const today = await getLectionary(dateParam(req));
    res.json({
      hour: 'Collect',
      title: today.shortWeek,
      season: normalizeSeason(today.season),
      date: today.date,
      numericalDate: today.numericalDate,
      parts: today.collect ? [{ title: today.collect.title, text: today.collect.text }] : [],
    });
  } catch (e: unknown) {
    log.err(e);
    res.status(500).json({ error: 'collect lookup failed' });
  }
});

router.get('/api/parts', async (_req: Request, res: Response) => {
  try {
    const list = await parts.getPartList();
    res.json({ parts: list });
  } catch (e: unknown) {
    log.err(e);
    res.status(500).json({ parts: [] });
  }
});

router.get('/api/parts/:part', async (req: Request, res: Response) => {
  const taglist = {
    times: ['morning', 'midday', 'evening', 'night', 'any'],
    themes: ['petition', 'praise', 'thanks', 'penitence', 'mourning', 'end', 'rest', 'hope', 'lament', 'community', 'beginning', 'death'],
  };
  try {
    const results = await parts.showAllParts({ part: req.params['part']! });
    res.json({ title: req.params['part'], parts: results, taglist });
  } catch (e: unknown) {
    log.err(e);
    res.status(500).json({ title: req.params['part'], parts: [], taglist });
  }
});

router.get('/api/rp', async (_req: Request, res: Response) => {
  try {
    const r = await bible.randomProverb();
    res.json({ title: r.title, text: r.text });
  } catch (e: unknown) {
    log.err(e);
    res.status(500).json({ error: 'not found' });
  }
});

router.post('/api/count', async (req: Request, res: Response) => {
  const id = String(req.body?.id ?? '');
  const page = String(req.body?.page ?? '');
  if (!id) {
    res.status(400).json({ now: 0, recent: 0 });
    return;
  }
  try {
    const cnt = await count.getCount(id, page);
    res.json(cnt);
  } catch (e: unknown) {
    log.err(e);
    res.status(500).json({ now: 0, recent: 0 });
  }
});

router.post('/api/addtag', async (req: Request, res: Response) => {
  try {
    const ok = await parts.addTag(req.body);
    res.status(ok ? 200 : 400).json({ ok });
  } catch (e: unknown) {
    log.err(e);
    res.status(400).json({ ok: false });
  }
});

router.post('/api/removetag', async (req: Request, res: Response) => {
  try {
    const ok = await parts.removeTag(req.body);
    res.status(ok ? 200 : 400).json({ ok });
  } catch (e: unknown) {
    log.err(e);
    res.status(400).json({ ok: false });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SPA fallback — anything that isn't /api/* or a static asset returns the
// Preact app shell so client-side routing can take over.
// ─────────────────────────────────────────────────────────────────────────────

router.get(/^\/(?!api\/).*/, (_req: Request, res: Response) => {
  res.sendFile(INDEX_HTML);
});

export default router;
