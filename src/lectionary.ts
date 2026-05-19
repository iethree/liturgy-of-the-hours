import rcl, { type LectionaryRecord } from 'daily-office-lectionary';
import { log } from './logger.ts';
import { format, subDay, isBetween } from './time.ts';
import { parts as defaultParts, type PartsStore } from './parts.ts';
import { calendar } from '../data/calendar.ts';
import type { DateLike, LectionaryDay, PartRecord } from './types.ts';

/**
 * Get the lectionary record for a date, augmented with shortWeek, season, collect, etc.
 * `partsStore` is optional to allow injecting an in-memory store in tests.
 */
export async function getLectionary(date?: DateLike, partsStore: PartsStore = defaultParts): Promise<LectionaryDay> {
  const target = format.object(date);
  const year = getYear(target);
  const [shortWeek, longWeek] = getWeek(target);
  const dow = format.dow(target);

  let record: LectionaryRecord | undefined;

  try {
    record = await rcl.get({ day: format.md(target) });
  } catch {
    // fall through
  }

  if (!record) {
    try {
      record = await rcl.get({ year, week: longWeek, day: dow });
    } catch (e: unknown) {
      log.err(e);
    }
  }

  if (!record) {
    try {
      record = await rcl.get({ year, title: longWeek });
    } catch (e: unknown) {
      log.err(e);
    }
  }

  if (!record) {
    throw new Error(`Failed to find lectionary for ${format.numerical(target)} ${shortWeek} ${dow}`);
  }

  const season = resolveSeason(record, shortWeek);
  const week = record.week ?? longWeek;
  const lessons = deepFlat(record.lessons as unknown);

  const collectRecord = await loadCollect(partsStore, record.title, shortWeek, longWeek);

  return {
    year: record.year ?? year,
    week,
    shortWeek,
    day: record.day ?? dow,
    season,
    title: record.title,
    date: format.short(target),
    numericalDate: format.numerical(target),
    lessons,
    psalms: {
      morning: record.psalms.morning ? [...record.psalms.morning] : undefined,
      evening: record.psalms.evening ? [...record.psalms.evening] : undefined,
    },
    collect: collectRecord,
  };
}

async function loadCollect(
  partsStore: PartsStore,
  title: string | undefined,
  shortWeek: string,
  longWeek: string,
): Promise<PartRecord | null> {
  if (title) {
    const t = await partsStore.getCollect(title).catch(() => null);
    if (t) return t;
  }
  return partsStore.getCollect({ $in: [shortWeek, longWeek] }).catch(() => null);
}

function resolveSeason(record: LectionaryRecord, shortWeek: string): string {
  if (shortWeek === 'Holy Week') return 'Holy Week';
  if (record.season === 'The Season after Pentecost') return 'Ordinary Time';
  if (record.season) return record.season;
  return getSeason(shortWeek) ?? 'Ordinary Time';
}

/**
 * Map a date to the lectionary "year" cycle. Year One/Two alternate by liturgical year (Advent → Christ-the-King).
 * Returns the cycle that started in Advent of the previous calendar year if we're before this year's Advent.
 */
export function getYear(date: DateLike): string {
  if (isBetween(date, '2018-12-02', '2019-11-30')) return 'Year One';
  if (isBetween(date, '2019-12-01', '2020-11-28')) return 'Year Two';
  if (isBetween(date, '2020-11-29', '2021-11-27')) return 'Year One';
  if (isBetween(date, '2021-11-28', '2022-11-26')) return 'Year Two';
  if (isBetween(date, '2022-11-27', '2023-12-02')) return 'Year One';
  if (isBetween(date, '2023-12-03', '2024-11-30')) return 'Year Two';
  if (isBetween(date, '2024-12-01', '2025-11-29')) return 'Year One';
  if (isBetween(date, '2025-11-30', '2026-11-28')) return 'Year Two';
  return 'Year One';
}

/**
 * Walk back from the given date up to 7 days to find the nearest calendar-keyed week.
 * Returns [shortWeek, longWeek]. Skips Ascension Day since it's a movable feast that doesn't carry weekly readings.
 */
export function getWeek(date: DateLike): [string, string] {
  let day = format.numerical(date);
  for (let i = 0; i < 7; i++) {
    const label = calendar[day];
    if (label) {
      if (label === 'Ascension Day') {
        day = subDay(day);
        continue;
      }
      return [label, getLongWeek(label)];
    }
    day = subDay(day);
  }
  throw new Error(`No week found for ${String(date)}`);
}

export function getLongWeek(shortWeek: string): string {
  if (shortWeek === 'Ash Wednesday') return 'Ash Wednesday and Following';
  if (shortWeek === 'Trinity Sunday') return 'The First Sunday after Pentecost: Trinity Sunday';
  if (shortWeek === 'Epiphany') return 'The Epiphany and Following';

  const match = /(lent|easter|christmas|advent|epiphany) (\d|last)/i.exec(shortWeek);
  if (match) return `Week of ${match[2]} ${match[1]}`;
  return shortWeek;
}

export function getSeason(week: string): string | null {
  const seasonMatch = /(lent|epiphany|christmas|easter|advent|pentecost)/i.exec(week);
  if (seasonMatch?.[1]) return seasonMatch[1];
  if (/proper/i.exec(week)) return 'Ordinary Time';
  if (/holy week/i.exec(week)) return 'Holy Week';
  return null;
}

export function getShortWeek(longWeek: string): string {
  const match = /Week of (\d|last) (lent|easter|christmas|advent|epiphany)/i.exec(longWeek);
  if (match) return `${match[2]} ${match[1]}`;
  return longWeek;
}

/** Recursively flatten possibly nested arrays/objects of string lessons. */
function deepFlat(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(deepFlat);
  if (value && typeof value === 'object') return Object.values(value).flatMap(deepFlat);
  return [];
}
