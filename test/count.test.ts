import { describe, test, expect } from 'bun:test';
import { createCount } from '../src/count.ts';

describe('count.getCount', () => {
  test('records a visit and returns a CountResult shape', async () => {
    const count = createCount({ dbPath: ':memory:' });
    const r = await count.getCount('user-1', '/hour/morning/20240101');
    expect(typeof r.now).toBe('number');
    expect(typeof r.recent).toBe('number');
    expect(r.now).toBeGreaterThanOrEqual(1);
  });

  test('does not double-count the same user (upsert on user id)', async () => {
    const count = createCount({ dbPath: ':memory:' });
    await count.getCount('user-2', '/page-a');
    const r = await count.getCount('user-2', '/page-b');
    expect(r.now).toBe(1);
  });

  test('tracks multiple distinct users', async () => {
    const count = createCount({ dbPath: ':memory:' });
    await count.getCount('a', '/');
    await count.getCount('b', '/');
    const r = await count.getCount('c', '/');
    expect(r.now).toBe(3);
  });
});
