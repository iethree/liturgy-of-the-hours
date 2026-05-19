import Datastore from '@seald-io/nedb';
import webPush, { type PushSubscription as WebPushSubscription } from 'web-push';
import schedule from 'node-schedule';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from './logger.ts';
import type { AlarmSetting, AlarmsPayload, SubscribePayload } from './types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface SubscriptionRecord {
  _id?: string;
  id: string;
  subscription: WebPushSubscription;
}

interface AlarmRecord {
  _id?: string;
  id: string;
  title: string;
  hr: number;
  min: number;
}

export interface PushStore {
  subscribe(payload: SubscribePayload): void;
  unsubscribe(id: string): void;
  setAlarms(payload: AlarmsPayload): void;
  /** Test-only escape hatch */
  scheduleJob?: schedule.Job;
}

const DEFAULT_SUB_DB = path.join(__dirname, '..', 'data', 'subscriptions.db');
const DEFAULT_ALARM_DB = path.join(__dirname, '..', 'data', 'alarms.db');

export function createPush(
  opts: {
    subDbPath?: string;
    alarmDbPath?: string;
    /** Disable the cron job (useful in tests). */
    scheduling?: boolean;
  } = {},
): PushStore {
  const subDbPath = opts.subDbPath ?? DEFAULT_SUB_DB;
  const alarmDbPath = opts.alarmDbPath ?? DEFAULT_ALARM_DB;
  const scheduling = opts.scheduling ?? true;

  const subDb = subDbPath === ':memory:'
    ? new Datastore<SubscriptionRecord>({ inMemoryOnly: true })
    : new Datastore<SubscriptionRecord>({ filename: subDbPath, autoload: true });
  const alarmDb = alarmDbPath === ':memory:'
    ? new Datastore<AlarmRecord>({ inMemoryOnly: true })
    : new Datastore<AlarmRecord>({ filename: alarmDbPath, autoload: true });

  async function getSubFromId(id: string): Promise<WebPushSubscription | null> {
    const result = await subDb.findOneAsync({ id });
    return result?.subscription ?? null;
  }

  function send(sub: WebPushSubscription | null, msg: string): void {
    if (!sub) return;
    const publicKey = process.env.VAPIDPUBLIC;
    const privateKey = process.env.VAPIDPRIVATE;
    if (!publicKey || !privateKey) {
      log.warn('VAPID keys not configured; cannot send push');
      return;
    }
    webPush
      .sendNotification(sub, msg, {
        TTL: 60,
        vapidDetails: {
          subject: 'mailto: root@infopanel.org',
          publicKey,
          privateKey,
        },
      })
      .catch((e: unknown) => log.warn('push failed', e));
  }

  function getBrowser(endpoint: string): string {
    const lower = endpoint.toLowerCase();
    if (lower.includes('mozilla')) return 'Firefox';
    if (lower.includes('googleapis')) return 'Chrome';
    return 'Unknown Browser';
  }

  async function setAlarms(payload: AlarmsPayload): Promise<void> {
    const saved: string[] = [];
    const tasks: Promise<unknown>[] = [];

    for (const [title, alarm] of Object.entries(payload.alarms)) {
      if (alarm.enabled) {
        saved.push(title);
        tasks.push(
          alarmDb.updateAsync(
            { id: payload.id, title },
            { $set: { id: payload.id, title, hr: Number(alarm.hr), min: Number(alarm.min) } },
            { upsert: true },
          ),
        );
      } else {
        tasks.push(alarmDb.removeAsync({ id: payload.id, title }, { multi: false }));
      }
    }

    await Promise.all(tasks);
    log.info('alarms for:', payload.id, 'saved:', saved.join(','));
  }

  let scheduleJob: schedule.Job | undefined;
  if (scheduling) {
    scheduleJob = schedule.scheduleJob('*/1 * * * *', async () => {
      const now = new Date();
      const notifications = await alarmDb.findAsync({
        hr: now.getUTCHours(),
        min: now.getUTCMinutes(),
      });
      for (const n of notifications) {
        log.info(`Notifying ${now.getHours()}:${now.getMinutes()} ${n.title} ${n.id}`);
        const sub = await getSubFromId(n.id);
        send(sub, n.title);
      }
    });
  }

  return {
    subscribe(payload: SubscribePayload): void {
      if (!payload.subscription?.endpoint) return;
      log.info('sub', getBrowser(payload.subscription.endpoint), payload.id);
      const subscription = payload.subscription as WebPushSubscription;
      subDb
        .updateAsync(
          { id: payload.id },
          { subscription, id: payload.id },
          { upsert: true },
        )
        .then(() => {
          send(subscription, 'Successfully Subscribed!');
          setAlarms({ id: payload.id, alarms: payload.alarms ?? {} });
        })
        .catch((e: unknown) => log.warn('sub update failed', e));
    },

    unsubscribe(id: string): void {
      subDb.removeAsync({ id }, { multi: true }).catch((e: unknown) => log.err(e));
      alarmDb.removeAsync({ id }, { multi: true }).catch((e: unknown) => log.err(e));
    },

    setAlarms(payload: AlarmsPayload): void {
      setAlarms(payload).catch((e: unknown) => log.err(e));
    },

    ...(scheduleJob ? { scheduleJob } : {}),
  };
}

export type { AlarmSetting };
export const push = createPush();
