import { describe, test, expect } from 'bun:test';
import {
  getYear,
  getWeek,
  getLongWeek,
  getSeason,
  getShortWeek,
  getLectionary,
} from '../src/lectionary.ts';
import { createParts } from '../src/parts.ts';
import { createBible } from '../src/bible.ts';

describe('getYear', () => {
  test('returns Year One for the 2018–2019 cycle', () => {
    expect(getYear('2019-06-01')).toBe('Year One');
  });

  test('returns Year Two for the 2019–2020 cycle', () => {
    expect(getYear('2020-06-01')).toBe('Year Two');
  });

  test('returns Year One for 2020–2021', () => {
    expect(getYear('2021-06-01')).toBe('Year One');
  });

  test('returns Year Two for 2023–2024', () => {
    expect(getYear('2024-06-01')).toBe('Year Two');
  });

  test('returns Year One for 2024–2025', () => {
    expect(getYear('2025-06-01')).toBe('Year One');
  });

  test('returns Year Two for 2025–2026', () => {
    expect(getYear('2026-03-01')).toBe('Year Two');
  });
});

describe('getLongWeek', () => {
  test('converts numbered season weeks to "Week of N season"', () => {
    expect(getLongWeek('Advent 2')).toBe('Week of 2 Advent');
    expect(getLongWeek('Lent 5')).toBe('Week of 5 Lent');
    expect(getLongWeek('Easter Last')).toBe('Week of Last Easter');
  });

  test('special-cases Ash Wednesday', () => {
    expect(getLongWeek('Ash Wednesday')).toBe('Ash Wednesday and Following');
  });

  test('special-cases Trinity Sunday', () => {
    expect(getLongWeek('Trinity Sunday')).toBe('The First Sunday after Pentecost: Trinity Sunday');
  });

  test('special-cases Epiphany', () => {
    expect(getLongWeek('Epiphany')).toBe('The Epiphany and Following');
  });

  test('passes through Propers unchanged', () => {
    expect(getLongWeek('Proper 17')).toBe('Proper 17');
  });
});

describe('getSeason', () => {
  test('maps season-prefixed weeks to their season', () => {
    expect(getSeason('Advent 1')).toBe('Advent');
    expect(getSeason('Lent 3')).toBe('Lent');
    expect(getSeason('Easter Week')).toBe('Easter');
    expect(getSeason('Pentecost')).toBe('Pentecost');
  });

  test('maps Proper to Ordinary Time', () => {
    expect(getSeason('Proper 17')).toBe('Ordinary Time');
  });

  test('returns null for unrecognized week names', () => {
    expect(getSeason('Some Random Day')).toBeNull();
  });
});

describe('getShortWeek', () => {
  test('reverses getLongWeek for numbered weeks', () => {
    expect(getShortWeek('Week of 2 Advent')).toBe('Advent 2');
  });

  test('passes through propers unchanged', () => {
    expect(getShortWeek('Proper 17')).toBe('Proper 17');
  });
});

describe('getWeek', () => {
  test('returns short + long week for a date in the calendar', () => {
    const [short, long] = getWeek('2024-12-01');
    expect(short).toBe('Advent 1');
    expect(long).toBe('Week of 1 Advent');
  });

  test('walks back to the previous keyed date when the day itself is not in the calendar', () => {
    // 2024-12-04 (Wednesday) — should resolve to Advent 1 from 2024-12-01
    const [short] = getWeek('2024-12-04');
    expect(short).toBe('Advent 1');
  });

  test('skips Ascension Day (it carries no weekly readings)', () => {
    // 2024-05-09 is Ascension Day. The next day should NOT resolve to Ascension Day.
    const [short] = getWeek('2024-05-10');
    expect(short).not.toBe('Ascension Day');
  });

  test('throws when no week is found in the lookback window', () => {
    expect(() => getWeek('1900-01-01')).toThrow();
  });
});

describe('getLectionary (integration with in-memory parts)', () => {
  test('produces a lectionary day with season, lessons, and date strings', async () => {
    const bible = createBible({ dbPath: ':memory:' });
    const parts = createParts({ dbPath: ':memory:', bible });

    const lect = await getLectionary('2024-06-09', parts);
    expect(lect.numericalDate).toBe('20240609');
    expect(lect.date).toBe('June 9');
    expect(typeof lect.season).toBe('string');
    expect(Array.isArray(lect.lessons)).toBe(true);
  });

  test('flags collect as null when no matching collect is stored', async () => {
    const bible = createBible({ dbPath: ':memory:' });
    const parts = createParts({ dbPath: ':memory:', bible });
    const lect = await getLectionary('2024-12-01', parts);
    expect(lect.collect).toBeNull();
  });

  test('returns the matching collect when one is stored', async () => {
    const bible = createBible({ dbPath: ':memory:' });
    const parts = createParts({ dbPath: ':memory:', bible });
    await parts.insert({
      _id: 'collect-advent1',
      part: 'collect',
      title: 'Advent 1',
      text: 'Almighty God, give us grace...',
    });
    const lect = await getLectionary('2024-12-01', parts);
    expect(lect.collect?.title).toBe('Advent 1');
  });
});
