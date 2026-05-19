import { describe, test, expect } from 'bun:test';
import { getHour, getHourNames, getPsalm } from '../src/hours.ts';
import { createParts } from '../src/parts.ts';
import type { BibleStore } from '../src/bible.ts';

function fakeBible(): BibleStore {
  return {
    async get(q: string) {
      return { title: q, text: `<p>fake-${q}</p>` };
    },
    async randomProverb() {
      return { title: 'Proverbs', text: '<p>random</p>' };
    },
  };
}

async function buildStore() {
  const parts = createParts({ dbPath: ':memory:', bible: fakeBible() });

  // Seed at least one record per type the hour builders look up.
  const records = [
    { _id: 'i-m', part: 'intro', text: 'morning intro', times: ['morning'], themes: [] },
    { _id: 'i-e', part: 'intro', text: 'evening intro', times: ['evening'], themes: [] },
    { _id: 'pf-a', part: 'preface', text: 'preface any', season: ['any'] },
    { _id: 'cant', part: 'canticle', text: 'a canticle' },
    { _id: 'pray-m', part: 'prayer', text: 'morning prayer', times: ['morning'], themes: ['petition'] },
    { _id: 'pray-e', part: 'prayer', text: 'evening prayer', times: ['evening'], themes: ['rest'] },
    { _id: 'pray-end-m', part: 'prayer', text: 'morning end', times: ['morning'], themes: ['end'] },
    { _id: 'pray-end-e', part: 'prayer', text: 'evening end', times: ['evening'], themes: ['end'] },
    { _id: 'pray-thx', part: 'prayer', title: 'General Thanksgiving', text: 'thanks!' },
    { _id: 'lp', part: 'prayer', title: "Lord's Prayer", text: 'our father...' },
    { _id: 'suff', part: 'prayer', title: 'Suffrages A', text: 'suffrages' },
    { _id: 'creed', part: 'creed', text: 'I believe' },
    { _id: 'litany', part: 'litany', text: 'litany' },
    { _id: 'gl', part: 'great litany', text: 'great litany' },
    { _id: 'conf', part: 'confession', text: 'confession' },
    { _id: 'col', part: 'collect', title: 'Proper 7', text: 'collect text' },
  ];
  for (const r of records) await parts.insert(r as Parameters<typeof parts.insert>[0]);
  return parts;
}

describe('getHourNames', () => {
  test('includes all of the canonical hours', () => {
    const names = getHourNames();
    for (const n of ['lauds', 'terce', 'sext', 'none', 'vespers', 'compline', 'matins', 'morning', 'noon', 'evening', 'lectionary', 'random']) {
      expect(names).toContain(n as typeof names[number]);
    }
  });
});

describe('getPsalm', () => {
  test('returns a psalm reference for valid type + day', () => {
    // dom is parsed by extracting the first integer from the human-readable date
    expect(getPsalm('morning', 'January 5')).toMatch(/^psalm/);
  });

  test('different rotations return different psalms for the same day', () => {
    expect(getPsalm('morning', 'January 1')).not.toBe(getPsalm('evening', 'January 1'));
  });

  test('throws for day-of-month outside the rotation length', () => {
    expect(() => getPsalm('morning', 'July 99')).toThrow();
  });
});

describe('getHour (integration)', () => {
  test('rejects unknown hour names', async () => {
    const parts = await buildStore();
    await expect(getHour('not-an-hour', '20240609', parts)).rejects.toThrow();
  });

  test('returns morning office with bible psalm + a prayer', async () => {
    const parts = await buildStore();
    const result = await getHour('morning', '20240609', parts);
    expect(result.hour).toBe('Morning');
    expect(result.numericalDate).toBe('20240609');
    expect(result.parts.length).toBeGreaterThanOrEqual(1);
    expect(result.parts[0]?.text).toContain('psalm');
  });

  test('is deterministic for the same date+hour seed', async () => {
    const parts = await buildStore();
    const a = await getHour('lauds', '20240609', parts);
    const b = await getHour('lauds', '20240609', parts);
    expect(a).toEqual(b);
  });

  test('compline on Thursday uses the great litany', async () => {
    const parts = await buildStore();
    const result = await getHour('compline', '20240620', parts);
    const texts = result.parts.map((p) => p.text).join('|');
    expect(texts).toContain('great litany');
  });

  test('compline on non-Thursday uses confession + litany', async () => {
    const parts = await buildStore();
    const result = await getHour('compline', '20240621', parts);
    const texts = result.parts.map((p) => p.text).join('|');
    expect(texts).toContain('confession');
  });

  test('lectionary hour produces only bible parts', async () => {
    const parts = await buildStore();
    const result = await getHour('lectionary', '20240609', parts);
    expect(result.hour).toBe('Lectionary');
    expect(result.parts.length).toBeGreaterThan(0);
    for (const p of result.parts) {
      expect(p.text).toContain('fake-');
    }
  });

  test('season is normalized (no whitespace)', async () => {
    const parts = await buildStore();
    const result = await getHour('morning', '20240609', parts);
    expect(result.season).not.toMatch(/\s/);
  });
});
