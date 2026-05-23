import { describe, test, expect } from 'bun:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getHour, getHourNames } from '../src/hours.ts';
import { createParts, type PartsStore } from '../src/parts.ts';
import { format, addDay } from '../src/time.ts';
import type { BibleStore } from '../src/bible.ts';
import type { PartRecord } from '../src/types.ts';

const DAYS = 180;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PARTS_DB_PATH = path.join(__dirname, '..', 'data', 'parts.db');

/**
 * Read the on-disk parts.db (NeDB's append-only JSON-lines format) and load
 * it into an in-memory parts store. This avoids racing NeDB's file
 * compaction against the real database during the test.
 */
async function loadPartsIntoMemory(bible: BibleStore): Promise<PartsStore> {
  const raw = await readFile(PARTS_DB_PATH, 'utf8');
  const store = createParts({ dbPath: ':memory:', bible });
  for (const line of raw.split('\n')) {
    if (!line) continue;
    let parsed: unknown;
    try { parsed = JSON.parse(line); } catch { continue; }
    if (!parsed || typeof parsed !== 'object') continue;
    const record = parsed as Partial<PartRecord> & { $$deleted?: boolean };
    // NeDB tombstones records with $$deleted; skip them.
    if (record.$$deleted) continue;
    if (!record._id) continue;
    await store.insert(record as PartRecord);
  }
  return store;
}

/**
 * Stand-in for the ESV-backed bible store. Returns a non-empty passage for
 * every query so this test isolates *our* data pipeline (calendar →
 * lectionary → parts.db) from the external cache. A real coverage gap will
 * surface as a calendar/lectionary throw or an empty parts array — not as a
 * missing bible passage.
 */
function alwaysOkBible(): BibleStore {
  return {
    async get(query: string) {
      return { title: query, text: `<p>passage:${query}</p>` };
    },
    async randomProverb() {
      return { title: 'Proverbs 3:5', text: '<p>trust in the LORD</p>' };
    },
  };
}

describe('content coverage', () => {
  test(
    `every canonical hour has content for the next ${DAYS} days`,
    async () => {
      // Snapshot of the real parts.db loaded into an in-memory store + fake bible.
      const parts = await loadPartsIntoMemory(alwaysOkBible());

      // 'random' is non-deterministic and not date-bound; skip it.
      const hours = getHourNames().filter((h) => h !== 'random');

      const start = new Date();
      let date = format.numerical(start);

      for (let dayOffset = 0; dayOffset < DAYS; dayOffset++) {
        for (const hour of hours) {
          let result;
          try {
            result = await getHour(hour, date, parts);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new Error(
              `Content gap: getHour("${hour}", "${date}") threw on day +${dayOffset} — ${msg}`,
            );
          }
          if (result.parts.length === 0) {
            throw new Error(
              `Content gap: getHour("${hour}", "${date}") returned 0 parts on day +${dayOffset}`,
            );
          }
        }
        date = addDay(date);
      }

      // Sanity assertion so the test reports a non-zero expect count on success.
      expect(true).toBe(true);
    },
    /* timeout */ 180_000,
  );
});
