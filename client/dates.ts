/**
 * Tiny date helpers replacing the slice of date-fns we used on the client.
 * date-fns pulled in ~30 KB minified (the `format` token engine + locale
 * tables); these are zero-dependency and total under a kilobyte.
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const pad2 = (n: number): string => (n < 10 ? `0${n}` : String(n));

/** `2024-03-05` style stored ISO → Date. Browser `new Date(s)` handles ISO 8601. */
export function parseISO(s: string): Date {
  return new Date(s);
}

/** "March 5" — for the home page date label. */
export function fmtLongDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "20240305" — the YYYYMMDD key used in URLs and localStorage. */
export function fmtDateKey(d: Date): string {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

/** Current local hour 0-23. */
export function getHour(d: Date): number {
  return d.getHours();
}

/** True if `d` is in the same local calendar day as now. */
export function isToday(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}
