/**
 * Typed wrappers around the server's JSON API. All responses are typed so
 * components don't sprinkle `any` everywhere.
 */

export interface HourPart {
  id?: string;
  part?: string;
  title?: string;
  subtitle?: string;
  text: string;
}

export interface HourResult {
  hour: string;
  title: string;
  season: string;
  date: string;
  numericalDate: string;
  parts: HourPart[];
}

export interface SeasonResponse {
  season: string;
}

export interface CountResponse {
  now: number;
  recent: number;
}

export interface PartsIndexResponse {
  parts: string[];
}

export interface PartsListResponse {
  title: string;
  parts: HourPart[];
  taglist: { times: string[]; themes: string[] };
}

export interface Proverb {
  title: string;
  text: string;
}

export interface ApiError {
  error: string;
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Partial<ApiError>;
    throw new Error(body.error ?? `${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  // POSTs may return 201/202/204 with no body.
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

const datePath = (date?: string): string => (date ? `/${date}` : '');

// ── reads ────────────────────────────────────────────────────────────────────

export const api = {
  season: (date?: string) => getJSON<SeasonResponse>(`/api/season${datePath(date)}`).then((r) => r.season),
  hour: (hour: string, date?: string) =>
    getJSON<HourResult>(
      date
        ? `/api/hour/${encodeURIComponent(date)}/${encodeURIComponent(hour)}`
        : `/api/hour/${encodeURIComponent(hour)}`,
    ),
  collect: (date?: string) => getJSON<HourResult>(`/api/collect${datePath(date)}`),
  partsIndex: () => getJSON<PartsIndexResponse>('/api/parts').then((r) => r.parts),
  partsList: (part: string) => getJSON<PartsListResponse>(`/api/parts/${encodeURIComponent(part)}`),
  randomProverb: () => getJSON<Proverb>('/api/rp'),

  // ── writes ─────────────────────────────────────────────────────────────────
  count: (id: string, page: string) => postJSON<CountResponse>('/api/count', { id, page }),
  addTag: (body: { id: string; field: 'times' | 'themes'; tag: string }) =>
    postJSON<{ ok: boolean }>('/api/addtag', body),
  removeTag: (body: { id: string; field: 'times' | 'themes'; tag: string }) =>
    postJSON<{ ok: boolean }>('/api/removetag', body),
};
