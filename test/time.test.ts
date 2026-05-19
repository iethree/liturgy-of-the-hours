import { describe, test, expect } from 'bun:test';
import { format, subDay, addDay, isBetween, subMinutes } from '../src/time.ts';

describe('time.format', () => {
  test('formats short month-day', () => {
    expect(format.short('2024-03-05')).toBe('March 5');
  });

  test('formats numerical YYYYMMDD', () => {
    expect(format.numerical('2024-03-05')).toBe('20240305');
  });

  test('formats day-of-month', () => {
    expect(format.dom('2024-03-05')).toBe('5');
  });

  test('formats day-of-week full name', () => {
    expect(format.dow('2024-03-05')).toBe('Tuesday');
  });

  test('formats abbreviated month-day', () => {
    expect(format.md('2024-03-05')).toBe('Mar 5');
  });

  test('accepts Date objects', () => {
    expect(format.numerical(new Date('2024-03-05T12:00:00Z'))).toBe('20240305');
  });

  test('defaults to today when no date is passed', () => {
    const today = format.numerical();
    expect(today).toMatch(/^\d{8}$/);
  });

  test('falls back to today on invalid input', () => {
    const today = format.numerical(new Date());
    expect(format.numerical('not-a-date')).toBe(today);
  });

  test('object returns a Date', () => {
    expect(format.object('2024-03-05')).toBeInstanceOf(Date);
  });
});

describe('time.subDay / addDay', () => {
  test('subDay rolls back one calendar day', () => {
    expect(subDay('2024-03-05')).toBe('20240304');
  });

  test('subDay crosses month boundary', () => {
    expect(subDay('2024-03-01')).toBe('20240229');
  });

  test('addDay rolls forward one calendar day', () => {
    expect(addDay('2024-03-05')).toBe('20240306');
  });

  test('addDay crosses month boundary', () => {
    expect(addDay('2024-02-29')).toBe('20240301');
  });
});

describe('time.isBetween', () => {
  test('returns true for date inside range', () => {
    expect(isBetween('2024-03-15', '2024-03-01', '2024-03-31')).toBe(true);
  });

  test('returns true for boundary dates (inclusive)', () => {
    expect(isBetween('2024-03-01', '2024-03-01', '2024-03-31')).toBe(true);
    expect(isBetween('2024-03-31', '2024-03-01', '2024-03-31')).toBe(true);
  });

  test('returns false for date outside range', () => {
    expect(isBetween('2024-04-01', '2024-03-01', '2024-03-31')).toBe(false);
    expect(isBetween('2024-02-28', '2024-03-01', '2024-03-31')).toBe(false);
  });
});

describe('time.subMinutes', () => {
  test('subtracts minutes from a date', () => {
    const result = subMinutes(new Date('2024-03-05T12:30:00Z'), 30);
    expect(result.toISOString()).toBe('2024-03-05T12:00:00.000Z');
  });
});
