import Datastore from '@seald-io/nedb';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { subMinutes } from './time.ts';
import type { CountResult } from './types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface LogRecord {
  user: string;
  page: string;
  date: string;
  visits: number;
}

export interface CountStore {
  getCount(id: string, page: string): Promise<CountResult>;
}

export function createCount(opts: { dbPath?: string } = {}): CountStore {
  const dbPath = opts.dbPath ?? path.join(__dirname, '..', 'data', 'users.log');
  const db = dbPath === ':memory:'
    ? new Datastore<LogRecord>({ inMemoryOnly: true })
    : new Datastore<LogRecord>({ filename: dbPath, autoload: true });

  async function recent(mins: number): Promise<number> {
    const after = subMinutes(new Date(), mins).toISOString();
    return db.countAsync({ date: { $gt: after } });
  }

  return {
    async getCount(id: string, page: string): Promise<CountResult> {
      await db.updateAsync(
        { user: id },
        {
          $set: { user: id, page, date: new Date().toISOString() },
          $inc: { visits: 1 },
        },
        { upsert: true },
      );
      const now = await recent(5);
      const within3h = await recent(180);
      return { now, recent: within3h - now };
    },
  };
}

export const count = createCount();
