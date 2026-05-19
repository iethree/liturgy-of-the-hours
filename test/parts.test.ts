import { describe, test, expect, beforeEach } from 'bun:test';
import { createParts, processText, pickSeeded, type PartsStore } from '../src/parts.ts';
import type { BibleStore } from '../src/bible.ts';

function fakeBible(): BibleStore {
  return {
    async get(query: string) {
      return { title: query, text: `text-of-${query}` };
    },
    async randomProverb() {
      return { title: 'Proverbs 1:1', text: 'fake proverb' };
    },
  };
}

describe('processText', () => {
  test('wraps indented lines in span.indent', () => {
    const out = processText('>indented line');
    expect(out).toContain('class="indent"');
    expect(out).toContain('indented line');
  });

  test('renders markdown emphasis', () => {
    const out = processText('*hello*');
    expect(out).toContain('<em>');
    expect(out).toContain('hello');
  });

  test('handles plain text without indents', () => {
    const out = processText('plain text');
    expect(out).toContain('plain text');
  });
});

describe('pickSeeded', () => {
  test('returns the same element for the same seed', () => {
    const arr = ['a', 'b', 'c', 'd', 'e'];
    expect(pickSeeded(arr, 'seed-1')).toBe(pickSeeded(arr, 'seed-1'));
  });

  test('returns undefined for an empty array', () => {
    expect(pickSeeded([] as string[], 'x')).toBeUndefined();
  });

  test('is case-insensitive on the seed', () => {
    const arr = ['a', 'b', 'c', 'd'];
    expect(pickSeeded(arr, 'SEED')).toBe(pickSeeded(arr, 'seed'));
  });

  test('returns an element from the array', () => {
    const arr = ['a', 'b', 'c'];
    const picked = pickSeeded(arr, 's');
    expect(picked).toBeDefined();
    expect(arr).toContain(picked!);
  });
});

describe('parts store (in-memory)', () => {
  let parts: PartsStore;

  beforeEach(() => {
    parts = createParts({ dbPath: ':memory:', bible: fakeBible() });
  });

  test('insert + getAllParts round-trips a record', async () => {
    await parts.insert({
      _id: 'p1',
      part: 'prayer',
      title: 'Test',
      text: 'hello world',
      themes: ['praise'],
      times: ['morning'],
    });
    const all = await parts.getAllParts({ part: 'prayer' });
    expect(all).toHaveLength(1);
    expect(all[0]?.title).toBe('Test');
  });

  test('showAllParts renders markdown in the text', async () => {
    await parts.insert({
      _id: 'p2',
      part: 'prayer',
      text: '*emphasized* text',
    });
    const all = await parts.showAllParts({ part: 'prayer' });
    expect(all[0]?.text).toContain('<em>');
  });

  test('getRandomPart returns null when nothing matches', async () => {
    const out = await parts.getRandomPart({ part: 'nope' }, 'seed');
    expect(out).toBeNull();
  });

  test('getRandomPart returns a rendered part when one matches', async () => {
    await parts.insert({ _id: 'p3', part: 'prayer', title: 'Hi', text: 'one' });
    const out = await parts.getRandomPart({ part: 'prayer' }, 'seed');
    expect(out?.title).toBe('Hi');
    expect(out?.text).toContain('one');
  });

  test('getRandomParts routes bible queries to the bible store', async () => {
    const out = await parts.getRandomParts([{ part: 'bible', passage: 'Psalm 1' }], 'seed');
    expect(out).toHaveLength(1);
    expect(out[0]?.title).toBe('Psalm 1');
    expect(out[0]?.text).toBe('text-of-Psalm 1');
  });

  test('getPartList returns unique part types', async () => {
    await parts.insert({ _id: 'a', part: 'prayer', text: '1' });
    await parts.insert({ _id: 'b', part: 'prayer', text: '2' });
    await parts.insert({ _id: 'c', part: 'collect', text: '3' });
    const list = await parts.getPartList();
    expect(list.sort()).toEqual(['collect', 'prayer']);
  });

  test('getCollect returns null when no collect is stored', async () => {
    const r = await parts.getCollect('Advent 1');
    expect(r).toBeNull();
  });

  test('getCollect returns the matching collect', async () => {
    await parts.insert({ _id: 'c1', part: 'collect', title: 'Advent 1', text: 'collect text' });
    const r = await parts.getCollect('Advent 1');
    expect(r?.title).toBe('Advent 1');
  });

  test('addTag adds a tag to the times set', async () => {
    await parts.insert({ _id: 'tag-1', part: 'prayer', text: 't', times: [] });
    const ok = await parts.addTag({ id: 'tag-1', field: 'times', tag: 'morning' });
    expect(ok).toBe(true);
    const all = await parts.getAllParts({ _id: 'tag-1' });
    expect(all[0]?.times).toContain('morning');
  });

  test('removeTag removes a tag', async () => {
    await parts.insert({ _id: 'tag-2', part: 'prayer', text: 't', themes: ['praise', 'thanks'] });
    const ok = await parts.removeTag({ id: 'tag-2', field: 'themes', tag: 'praise' });
    expect(ok).toBe(true);
    const all = await parts.getAllParts({ _id: 'tag-2' });
    expect(all[0]?.themes).not.toContain('praise');
    expect(all[0]?.themes).toContain('thanks');
  });

  test('addTag rejects an unknown field', async () => {
    const ok = await parts.addTag({ id: 'x', field: 'not-a-field' as 'times', tag: 'x' });
    expect(ok).toBe(false);
  });
});
