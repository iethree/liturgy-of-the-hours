import Datastore from '@seald-io/nedb';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from './logger.ts';
import type { Passage, PassageRecord } from './types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface BibleStore {
  get(query: string): Promise<Passage>;
  randomProverb(): Promise<Passage>;
}

interface ESVResponse {
  canonical?: string;
  passages?: string[];
}

const DEFAULT_DB_PATH = path.join(__dirname, '..', 'data', 'passages.db');

/**
 * Returns a bible-passage service backed by a NeDB cache and the ESV API.
 * Pass `inMemory` (or `dbPath: ':memory:'`) in tests so nothing touches disk.
 */
export function createBible(opts: { dbPath?: string; esvKey?: string; fetchImpl?: typeof fetch } = {}): BibleStore {
  const dbPath = opts.dbPath ?? DEFAULT_DB_PATH;
  const esvKey = opts.esvKey ?? process.env.ESV_KEY ?? '';
  const fetchImpl = opts.fetchImpl ?? fetch;

  const db = dbPath === ':memory:'
    ? new Datastore<PassageRecord>({ inMemoryOnly: true })
    : new Datastore<PassageRecord>({ filename: dbPath, autoload: true });

  async function getFromDb(query: string): Promise<Passage | null> {
    const result = await db.findOneAsync({ queries: query });
    if (!result) return null;
    return { title: result.title, text: result.text };
  }

  async function saveToDb(query: string, passage: Passage): Promise<void> {
    const existing = await db.findOneAsync({ title: passage.title });
    if (existing) {
      await db.updateAsync({ title: passage.title }, { $push: { queries: query } }, {});
      return;
    }
    await db.insertAsync({
      title: passage.title,
      text: passage.text,
      queries: [passage.title, query],
      views: 1,
    } as PassageRecord);
  }

  async function getFromESV(rawQuery: string): Promise<Passage> {
    if (!esvKey) {
      throw new Error('ESV_KEY not set — cannot fetch passage');
    }
    const query = rawQuery.replace(/–/g, '-').replace(/\(\[/g, ',').replace(/\)\]/g, '');
    const url =
      `https://api.esv.org/v3/passage/html/?q=${encodeURIComponent(query)}` +
      '&wrapping-div=true&div-classes=esv-text&include-footnotes=false&include-audio-link=false';

    log.info('fetching ESV', query);
    const res = await fetchImpl(url, {
      headers: { Accept: 'application/json', Authorization: esvKey },
    });
    if (!res.ok) throw new Error(`ESV request failed: ${res.status}`);
    const body = (await res.json()) as ESVResponse;
    if (!body.canonical || !body.passages?.length) {
      throw new Error(`ESV returned no passage for "${query}"`);
    }
    return { title: body.canonical, text: body.passages.join(' ') };
  }

  return {
    async get(query: string): Promise<Passage> {
      const cached = await getFromDb(query).catch((e: unknown) => {
        log.warn('passage db lookup failed', e);
        return null;
      });
      if (cached) return cached;

      const fresh = await getFromESV(query);
      saveToDb(query, fresh).catch((e: unknown) => log.warn('failed to cache passage', e));
      return fresh;
    },

    async randomProverb(): Promise<Passage> {
      const chapter = Math.floor(Math.random() * 31) + 1;
      const verse = Math.floor(Math.random() * 20) + 1;
      return this.get(`proverbs ${chapter}:${verse}`);
    },
  };
}

export const bible = createBible();
