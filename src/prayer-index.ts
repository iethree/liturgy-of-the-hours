import express, { type Request, type Response, type Router } from 'express';
import { log } from './logger.ts';
import { parts } from './parts.ts';
import { getHour } from './hours.ts';
import { count } from './count.ts';
import { getLectionary } from './lectionary.ts';
import { push } from './push.ts';
import { bible } from './bible.ts';
import { format } from './time.ts';

const router: Router = express.Router();

router.get('/', async (_req: Request, res: Response) => {
  let season = 'ordinarytime';
  try {
    const lect = await getLectionary();
    season = lect.season.toLowerCase().replace(/\s/g, '');
  } catch (e: unknown) {
    log.warn('lectionary lookup failed on home', e);
  }

  res.render('home', {
    title: 'Liturgy of the Hours',
    date: format.short(),
    season,
  });
});

router.get('/hour/:hour/:date?', async (req: Request, res: Response) => {
  const date = req.params['date'] ? format.numerical(req.params['date']) : undefined;
  try {
    const results = await getHour(req.params['hour']!, date);
    res.render('hour', results);
  } catch (e: unknown) {
    log.err(e);
    res.redirect('/');
  }
});

router.get('/season/:date?', async (req: Request, res: Response) => {
  const date = format.numerical(req.params['date']);
  try {
    const lect = await getLectionary(date);
    res.send(lect.season);
  } catch (e: unknown) {
    log.err(e);
    res.status(500).send('ordinary');
  }
});

router.get('/lectionary/:date?', async (req: Request, res: Response) => {
  const date = req.params['date'] ? format.numerical(req.params['date']) : undefined;
  try {
    const results = await getHour('lectionary', date);
    res.render('lectionary', results);
  } catch (e: unknown) {
    log.err(e);
    res.redirect('/');
  }
});

router.get('/collect/:date?', async (req: Request, res: Response) => {
  const date = req.params['date'] ? format.numerical(req.params['date']) : undefined;
  try {
    const today = await getLectionary(date);
    if (!today.collect) {
      res.redirect('/');
      return;
    }
    res.render('hour', {
      hour: 'Collect',
      title: today.shortWeek,
      season: today.season.toLowerCase().replace(/\s/g, ''),
      date: today.date,
      numericalDate: today.numericalDate,
      parts: [{ title: today.collect.title, text: today.collect.text }],
    });
  } catch (e: unknown) {
    log.err(e);
    res.redirect('/');
  }
});

router.get('/api/lectionary/:date?', async (req: Request, res: Response) => {
  const date = req.params['date'] ? format.numerical(req.params['date']) : undefined;
  try {
    const results = await getHour('lectionary', date);
    res.status(200).json(results);
  } catch (e: unknown) {
    log.err(e);
    res.status(500).json({ error: 'lectionary lookup failed' });
  }
});

router.get('/api/collect/:date?', async (req: Request, res: Response) => {
  const date = req.params['date'] ? format.numerical(req.params['date']) : undefined;
  try {
    const today = await getLectionary(date);
    res.json({
      hour: 'Collect',
      title: today.shortWeek,
      season: today.season.toLowerCase().replace(/\s/g, ''),
      date: today.date,
      numericalDate: today.numericalDate,
      parts: today.collect ? [{ title: today.collect.title, text: today.collect.text }] : [],
    });
  } catch (e: unknown) {
    log.err(e);
    res.status(500).json({ error: 'collect lookup failed' });
  }
});

router.post('/count', async (req: Request, res: Response) => {
  const id = String(req.body?.id ?? '');
  const page = String(req.body?.page ?? '');
  if (!id) {
    res.status(400).send({ now: 0, recent: 0 });
    return;
  }
  try {
    const cnt = await count.getCount(id, page);
    res.status(200).json(cnt);
  } catch (e: unknown) {
    log.err(e);
    res.status(500).json({ now: 0, recent: 0 });
  }
});

router.get('/rp', async (_req: Request, res: Response) => {
  try {
    const response = await bible.randomProverb();
    res.render('hour', {
      hour: 'Proverb',
      title: response.title,
      season: 'ordinarytime',
      date: format.short(),
      numericalDate: format.numerical(),
      parts: [{ title: response.title, text: response.text }],
    });
  } catch (e: unknown) {
    log.err(e);
    res.redirect('/');
  }
});

router.post('/rp', async (_req: Request, res: Response) => {
  try {
    const r = await bible.randomProverb();
    res.status(200).send(`${r.title} - ${r.text}`);
  } catch (e: unknown) {
    log.err(e);
    res.status(500).send('not found');
  }
});

router.get('/list', async (_req: Request, res: Response) => {
  try {
    const results = await parts.getPartList();
    res.render('parts-index', { parts: results });
  } catch (e: unknown) {
    log.err(e);
    res.redirect('/');
  }
});

router.get('/list/:part', async (req: Request, res: Response) => {
  const taglist = {
    times: ['morning', 'midday', 'evening', 'night', 'any'],
    themes: ['petition', 'praise', 'thanks', 'penitence', 'mourning', 'end', 'rest', 'hope', 'lament', 'community', 'beginning', 'death'],
  };
  try {
    const results = await parts.showAllParts({ part: req.params['part']! });
    res.render('parts-list', { title: req.params['part'], parts: results, taglist });
  } catch (e: unknown) {
    log.err(e);
    res.redirect('/list');
  }
});

router.post('/addTag', async (req: Request, res: Response) => {
  try {
    const result = await parts.addTag(req.body);
    res.sendStatus(result ? 200 : 400);
  } catch (e: unknown) {
    log.err(e);
    res.sendStatus(400);
  }
});

router.post('/removeTag', async (req: Request, res: Response) => {
  try {
    const result = await parts.removeTag(req.body);
    res.sendStatus(result ? 200 : 400);
  } catch (e: unknown) {
    log.err(e);
    res.sendStatus(400);
  }
});

router.post('/subscribe', (req: Request, res: Response) => {
  push.subscribe(req.body);
  res.sendStatus(201);
});

router.post('/unsubscribe', (req: Request, res: Response) => {
  const id = typeof req.body === 'string' ? req.body : String(req.body?.id ?? '');
  if (!id) {
    res.sendStatus(400);
    return;
  }
  push.unsubscribe(id);
  res.sendStatus(202);
});

router.post('/alarms', (req: Request, res: Response) => {
  push.setAlarms(req.body);
  res.sendStatus(204);
});

export default router;
