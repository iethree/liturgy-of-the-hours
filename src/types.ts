export type DateLike = Date | string | undefined;

export interface PartRecord {
  _id: string;
  part: string;
  title?: string;
  subtitle?: string;
  text: string;
  source?: string;
  season?: string[];
  times?: string[];
  themes?: string[];
}

export interface RenderedPart {
  id?: string;
  part?: string;
  title?: string;
  subtitle?: string;
  text: string;
}

export interface PassageRecord {
  _id?: string;
  title: string;
  text: string;
  queries: string[];
  views?: number;
}

export interface Passage {
  title: string;
  text: string;
}

export interface Psalms {
  morning?: string[];
  evening?: string[];
}

export interface LectionaryDay {
  year: string;
  week: string;
  shortWeek: string;
  day: string;
  season: string;
  title?: string;
  date: string;
  numericalDate: string;
  lessons: string[];
  psalms: Psalms;
  collect: PartRecord | null;
}

/** Mongo-style query operators we use (a small subset NeDB supports). */
export type Operator<T> =
  | T
  | { $in?: T[]; $nin?: T[] }
  | { $eq?: T };

export interface PartQuery {
  _id?: string;
  part?: Operator<string>;
  title?: string | RegExp;
  subtitle?: string;
  text?: string;
  season?: Operator<string>;
  times?: Operator<string>;
  themes?: Operator<string>;
  $or?: PartQuery[];
}

export interface BiblePartQuery {
  part: 'bible';
  passage: string;
}

export interface SeasonPartQuery extends PartQuery {
  /** When the lectionary returns a non-`bible` part we need to pull from parts.db */
  passage?: never;
}

export type HourPartQuery = BiblePartQuery | PartQuery;

export interface HourResult {
  hour: string;
  title: string;
  season: string;
  date: string;
  numericalDate: string;
  parts: RenderedPart[];
}

export interface AlarmSetting {
  hr: string | number;
  min: string | number;
  enabled: boolean;
}

export interface AlarmsPayload {
  id: string;
  alarms: Record<string, AlarmSetting>;
}

export interface SubscribePayload extends AlarmsPayload {
  subscription: {
    endpoint: string;
    keys?: { p256dh?: string; auth?: string };
  };
}

export interface CountResult {
  now: number;
  recent: number;
}

export interface TagPayload {
  id: string;
  field: 'times' | 'themes';
  tag: string;
}
