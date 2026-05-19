import { describe, test, expect } from 'bun:test';
import { createPush } from '../src/push.ts';

describe('push.setAlarms', () => {
  test('is a no-op when no alarms are supplied', () => {
    const push = createPush({ subDbPath: ':memory:', alarmDbPath: ':memory:', scheduling: false });
    expect(() => push.setAlarms({ id: 'u', alarms: {} })).not.toThrow();
  });

  test('accepts an enabled alarm without throwing', () => {
    const push = createPush({ subDbPath: ':memory:', alarmDbPath: ':memory:', scheduling: false });
    expect(() =>
      push.setAlarms({
        id: 'u',
        alarms: { Morning: { hr: '07', min: '00', enabled: true } },
      }),
    ).not.toThrow();
  });
});

describe('push.subscribe / unsubscribe', () => {
  test('ignores a subscribe with no endpoint', () => {
    const push = createPush({ subDbPath: ':memory:', alarmDbPath: ':memory:', scheduling: false });
    expect(() =>
      push.subscribe({
        id: 'u',
        subscription: { endpoint: '' },
        alarms: {},
      }),
    ).not.toThrow();
  });

  test('unsubscribe runs without error for an unknown id', () => {
    const push = createPush({ subDbPath: ':memory:', alarmDbPath: ':memory:', scheduling: false });
    expect(() => push.unsubscribe('does-not-exist')).not.toThrow();
  });
});
