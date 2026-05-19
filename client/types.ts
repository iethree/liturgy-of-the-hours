export type Theme = 'light' | 'dark' | 'system';

export type Version = 'lite' | 'full';

export interface AlarmSetting {
  hr: string | number;
  min: string | number;
  enabled: boolean;
}

export type Alarms = Record<string, AlarmSetting>;

export interface CountResponse {
  now: number;
  recent: number;
}
