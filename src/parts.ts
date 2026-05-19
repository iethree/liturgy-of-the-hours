import Datastore from '@seald-io/nedb';
import MarkdownIt from 'markdown-it';
import randomSeed from 'random-seed';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from './logger.ts';
import { bible as defaultBible, type BibleStore } from './bible.ts';
import type {
  BiblePartQuery,
  HourPartQuery,
  PartQuery,
  PartRecord,
  RenderedPart,
  TagPayload,
} from './types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const md = new MarkdownIt({ html: true });

export interface PartsStore {
  getCollect(week: string | { $in: string[] }): Promise<PartRecord | null>;
  getRandomParts(queries: HourPartQuery[], seed: string): Promise<RenderedPart[]>;
  getRandomPart(query: PartQuery, seed: string): Promise<RenderedPart | null>;
  getAllParts(query: PartQuery): Promise<PartRecord[]>;
  showAllParts(query: PartQuery): Promise<RenderedPart[]>;
  getPartList(): Promise<string[]>;
  addTag(body: TagPayload): Promise<boolean>;
  removeTag(body: TagPayload): Promise<boolean>;
  /** Exposed so tests can seed the in-memory store. */
  insert(record: PartRecord): Promise<PartRecord>;
}

const DEFAULT_DB_PATH = path.join(__dirname, '..', 'data', 'parts.db');

function isBibleQuery(q: HourPartQuery): q is BiblePartQuery {
  return 'part' in q && (q as BiblePartQuery).part === 'bible' && typeof (q as BiblePartQuery).passage === 'string';
}

/** Add italics/bold/indent shorthand, then render markdown. */
export function processText(text: string): string {
  let out = text;
  out = out.replace(/>\*\*(.*\S)/gi, '>**$1**');
  out = out.replace(/>\*(\w.*\S)/gi, '>*$1*');
  out = out.replace(/\r\n/gi, '\\s\\s\r\n');
  out = out.replace(/>(.*)/gi, '<span class="indent"> $1 </span>');
  return md.render(out);
}

/** Seeded selector — same seed always picks the same element. */
export function pickSeeded<T>(items: ReadonlyArray<T>, seed: string): T | undefined {
  if (items.length === 0) return undefined;
  const gen = randomSeed.create(seed.toLowerCase());
  return items[gen(items.length)];
}

export function createParts(opts: { dbPath?: string; bible?: BibleStore } = {}): PartsStore {
  const dbPath = opts.dbPath ?? DEFAULT_DB_PATH;
  const bible = opts.bible ?? defaultBible;

  const db = dbPath === ':memory:'
    ? new Datastore<PartRecord>({ inMemoryOnly: true })
    : new Datastore<PartRecord>({ filename: dbPath, autoload: true });

  async function getAllParts(query: PartQuery): Promise<PartRecord[]> {
    const results = await db.findAsync(query as Record<string, unknown>);
    return results;
  }

  function render(part: PartRecord): RenderedPart {
    return {
      id: part._id,
      part: part.part,
      title: part.title,
      subtitle: part.subtitle,
      text: processText(part.text),
    };
  }

  async function getRandomPart(query: PartQuery, seed: string): Promise<RenderedPart | null> {
    const results = await getAllParts(query);
    const chosen = pickSeeded(results, seed);
    if (!chosen?.text) return null;
    return render(chosen);
  }

  async function getRandomParts(queries: HourPartQuery[], seed: string): Promise<RenderedPart[]> {
    const tasks = queries.map(async (q): Promise<RenderedPart | null> => {
      if (isBibleQuery(q)) {
        try {
          const passage = await bible.get(q.passage);
          return { title: passage.title, text: passage.text };
        } catch (e: unknown) {
          log.warn('bible query failed', e);
          return null;
        }
      }
      try {
        return await getRandomPart(q, seed);
      } catch (e: unknown) {
        log.warn('part query failed', e);
        return null;
      }
    });
    const results = await Promise.all(tasks);
    return results.filter((p): p is RenderedPart => p !== null);
  }

  async function showAllParts(query: PartQuery): Promise<RenderedPart[]> {
    const results = await getAllParts(query);
    return results.map(render);
  }

  async function getCollect(week: string | { $in: string[] }): Promise<PartRecord | null> {
    const results = await getAllParts({ part: 'collect', title: week as string });
    return results[0] ?? null;
  }

  async function getPartList(): Promise<string[]> {
    const all = await getAllParts({});
    return [...new Set(all.map((p) => p.part).filter((p): p is string => Boolean(p)))];
  }

  async function update(id: string, operation: Record<string, unknown>): Promise<boolean> {
    const num = await db.updateAsync({ _id: id }, operation, {});
    return Boolean(num);
  }

  async function addTag(body: TagPayload): Promise<boolean> {
    if (body.field !== 'times' && body.field !== 'themes') return false;
    return update(body.id, { $addToSet: { [body.field]: body.tag } });
  }

  async function removeTag(body: TagPayload): Promise<boolean> {
    if (body.field !== 'times' && body.field !== 'themes') return false;
    return update(body.id, { $pull: { [body.field]: body.tag } });
  }

  async function insert(record: PartRecord): Promise<PartRecord> {
    return db.insertAsync(record);
  }

  return {
    getCollect,
    getRandomParts,
    getRandomPart,
    getAllParts,
    showAllParts,
    getPartList,
    addTag,
    removeTag,
    insert,
  };
}

export const parts = createParts();
