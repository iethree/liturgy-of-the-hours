import { log } from './logger.ts';
import { parts as defaultParts, type PartsStore } from './parts.ts';
import { getLectionary } from './lectionary.ts';
import type { DateLike, HourPartQuery, HourResult, LectionaryDay } from './types.ts';

export type HourName =
  | 'lauds' | 'terce' | 'sext' | 'none' | 'vespers' | 'compline' | 'matins'
  | 'lectionary' | 'morning' | 'noon' | 'evening' | 'random';

type QueryBuilder = (l: LectionaryDay) => HourPartQuery[];

const partQueries: Record<HourName, QueryBuilder> = {
  lauds: (l) => [
    { part: 'intro', times: 'morning' },
    { part: 'bible', passage: morningPsalm(l) },
    { part: 'prayer', themes: { $nin: ['end'] }, times: { $nin: ['evening', 'night'] } },
    { part: 'prayer', themes: 'end', times: { $nin: ['evening', 'night'] } },
  ],
  terce: (l) => [
    { part: 'preface', season: { $in: [l.season, 'any'] } },
    { part: 'canticle' },
    { part: { $in: ['prayer', 'collect'] }, themes: 'petition' },
    { title: /lord's prayer/i },
    { themes: 'end', times: { $nin: ['evening', 'night'] } },
  ],
  sext: (l) => [
    { part: 'preface', season: { $in: [l.season, 'any'] } },
    { part: 'bible', passage: getPsalm('ascent', l.date) },
    ...(l.collect ? [{ _id: l.collect._id }] : []),
    { part: 'creed' },
    { themes: 'end', times: { $nin: ['evening', 'night'] } },
  ],
  none: (l) => [
    { part: 'preface', season: { $in: [l.season, 'any'] } },
    { part: 'bible', passage: l.lessons[1] ?? '1 Tim 2' },
    { themes: 'end' },
  ],
  vespers: (l) => [
    { part: 'intro', times: 'evening' },
    { part: 'bible', passage: eveningPsalm(l) },
    { part: { $in: ['prayer', 'collect'] }, themes: { $nin: ['daily', 'saint'] } },
    { part: 'prayer', title: /general thanksgiving/i },
    { themes: 'end', times: { $nin: ['morning'] } },
  ],
  compline: (l) => {
    if (l.day === 'Thursday') {
      return [
        { part: 'intro', times: 'evening' },
        { part: 'great litany' },
        { themes: 'end', times: 'evening' },
      ];
    }
    return [
      { part: 'intro', times: 'evening' },
      { part: 'confession' },
      { part: 'litany' },
      { part: 'prayer', title: /suffrage/i },
      { part: 'prayer', times: 'evening', themes: 'end' },
    ];
  },
  matins: () => [
    { part: 'intro', times: 'evening' },
    { part: 'canticle' },
    { part: 'prayer', times: { $nin: ['morning'] } },
    { part: 'prayer', times: 'evening', themes: 'end' },
  ],
  lectionary: (l) => {
    const all: HourPartQuery[] = [];
    for (const p of flattenLessonsAndPsalms(l.lessons, l.psalms)) {
      all.push({ part: 'bible', passage: p });
    }
    return all;
  },
  morning: (l) => [
    { part: 'bible', passage: getPsalm('morning', l.date) },
    {
      part: 'prayer',
      $or: [{ times: { $in: ['morning', 'any'] } }, { themes: { $in: ['petition'] } }],
    },
  ],
  noon: (l) => [
    { part: 'bible', passage: getPsalm('ascent', l.date) },
    ...(l.collect ? [{ _id: l.collect._id }] : []),
  ],
  evening: (l) => [
    { part: 'bible', passage: getPsalm('evening', l.date) },
    {
      part: 'prayer',
      $or: [
        { times: { $in: ['evening', 'night'] } },
        { themes: { $in: ['thanks', 'praise', 'hope', 'rest'] } },
      ],
    },
  ],
  random: () => [{}],
};

function morningPsalm(l: LectionaryDay): string {
  const ps = l.psalms.morning?.[0];
  if (!ps) {
    log.warn(`no morning psalm for ${l.shortWeek} ${l.date}`);
    return 'Psalm 1';
  }
  return `Psalm ${ps}`;
}

function eveningPsalm(l: LectionaryDay): string {
  const ps = l.psalms.evening?.[0];
  if (!ps) {
    log.warn(`no evening psalm for ${l.shortWeek} ${l.date}`);
    return 'Psalm 100';
  }
  return `Psalm ${ps}`;
}

export function getHourNames(): readonly HourName[] {
  return Object.keys(partQueries) as HourName[];
}

export async function getHour(rawHour: string, date?: DateLike, partsStore: PartsStore = defaultParts): Promise<HourResult> {
  log.info('getHour', rawHour, String(date ?? ''));

  const hour = rawHour.toLowerCase() as HourName;
  const build = partQueries[hour];
  if (!build) throw new Error(`hour not found: ${rawHour}`);

  const today = await getLectionary(date, partsStore);
  const queries = build(today);

  const seed = hour === 'random'
    ? `random${Math.floor(Math.random() * 999) + 1}`
    : `${today.numericalDate}${hour}`;

  const hourParts = await partsStore.getRandomParts(queries, seed);

  return {
    hour: hour.charAt(0).toUpperCase() + hour.slice(1),
    title: today.shortWeek,
    season: today.season.toLowerCase().replace(/\s/g, ''),
    date: today.date,
    numericalDate: today.numericalDate,
    parts: hourParts,
  };
}

/**
 * Pick a psalm from one of the seeded weekly rotations based on the day of the month.
 * `type` controls which rotation. Throws if the day-of-month index is out of range.
 */
export function getPsalm(type: 'thanks' | 'praise' | 'ascent' | 'morning' | 'evening', date: string): string {
  const domMatch = /(\d+)/.exec(date);
  const dom = domMatch?.[1] ? Number(domMatch[1]) : 1;

  const psalms = {
    thanks: [
      '65', '67', '75', '107', '124', '136', '18', '21', '30', '32',
      '34', '40:1-11', '66:13-20', '92', '108', '116', '118', '138', '8', '105', '106',
      '135', '136', '11', '16', '23', '27', '62', '63', '91', '121', '125', '131',
    ],
    praise: [
      '8', '19:1-6', '33', '66:1-12', '67', '95', '100', '103', '104', '111',
      '113', '114', '117', '145', '146', '147', '148', '149', '150', '1',
      '36', '37', '49', '73', '112', '127', '128', '133', '19:7-14', '50', '2',
    ],
    ascent: [
      '119.1-8', '119.9-16', '119.17-24', '119.25-32', '119.33-40', '119.41-48', '119.49-56',
      '119.57-64', '119.65-72', '119.73-80', '119.81-88', '119.89-96', '119.97-104', '119.105-112',
      '119.113-120', '119.121-128', '119.129-136', '119.137-144', '119.145-152', '119.153-160',
      '119.161-168', '119.169-176', '121', '122', '123, 124', '125, 126', '127', '128', '129',
      '130', '131', '133',
    ],
    morning: [
      '1', '2', '3', '4', '5', '6', '8', '11', '12', '13',
      '14', '15', '16', '20', '23', '24', '27', '28', '29', '30', '41',
      '42', '43', '46', '47', '50', '51', '52', '53', '54', '60', '61', '62',
    ],
    evening: [
      '63', '64', '65', '67', '70', '75', '76', '82', '85', '87',
      '92', '93', '95', '96', '97', '98', '99', '100', '101', '105', '106',
      '108', '110', '111', '112', '113', '114', '117', '120', '121', '122', '123', '124',
    ],
  } as const;

  const series = psalms[type];
  const pick = series[dom - 1];
  if (!pick) throw new Error(`cannot find psalm for ${date}`);
  return `psalm${pick}`;
}

function flattenLessonsAndPsalms(lessons: string[], psalms: LectionaryDay['psalms']): string[] {
  const ps: string[] = [];
  if (psalms.morning) ps.push(...psalms.morning);
  if (psalms.evening) ps.push(...psalms.evening);
  return [...lessons, ...ps.map((p) => `Psalm ${p}`)];
}
