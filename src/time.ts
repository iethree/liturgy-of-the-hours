import {
  format as dfFormat,
  parseISO,
  isValid,
  isAfter,
  isBefore,
  addDays,
  subDays,
  subMinutes,
} from 'date-fns';
import type { DateLike } from './types.ts';

function toDate(date?: DateLike): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  const parsed = parseISO(date);
  return isValid(parsed) ? parsed : new Date();
}

export const format = {
  short: (date?: DateLike): string => dfFormat(toDate(date), 'MMMM d'),
  numerical: (date?: DateLike): string => dfFormat(toDate(date), 'yyyyMMdd'),
  dom: (date?: DateLike): string => dfFormat(toDate(date), 'd'),
  dow: (date?: DateLike): string => dfFormat(toDate(date), 'EEEE'),
  md: (date?: DateLike): string => dfFormat(toDate(date), 'MMM d'),
  object: (date?: DateLike): Date => toDate(date),
};

/** Returns YYYYMMDD-formatted date 1 day earlier. */
export function subDay(date?: DateLike): string {
  return format.numerical(subDays(toDate(date), 1));
}

/** Returns YYYYMMDD-formatted date 1 day later. */
export function addDay(date?: DateLike): string {
  return format.numerical(addDays(toDate(date), 1));
}

/** Inclusive range check. */
export function isBetween(x: DateLike, beg: DateLike, end: DateLike): boolean {
  const xd = toDate(x);
  const bd = toDate(beg);
  const ed = toDate(end);
  if (xd.getTime() === bd.getTime() || xd.getTime() === ed.getTime()) return true;
  return isAfter(xd, bd) && isBefore(xd, ed);
}

export { subMinutes };
