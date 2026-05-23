import { useEffect, useState } from 'preact/hooks';
import { useLocation, useRoute } from 'preact-iso';
import { isToday, parseISO } from '../dates.ts';
import { api, type HourResult } from '../api.ts';
import { Modal } from './Modal.tsx';
import { getId } from '../util.ts';

interface CountState { now: number; recent: number }

function saveOffice(hour: string): void {
  const today = localStorage.getItem('today');
  const first = !today || !isToday(parseISO(today));
  if (first) localStorage.setItem('today', new Date().toISOString());

  const stored = first ? '' : localStorage.getItem('offices') ?? '';
  const list = stored ? stored.split(',').filter(Boolean) : [];
  if (!list.includes(hour)) {
    list.push(hour);
    localStorage.setItem('offices', list.join(','));
  }
}

export function Hour() {
  const { path } = useLocation();
  const { params } = useRoute();
  const dateParam = params.date as string | undefined;

  // Route can be /hour/:hour/:date, /lectionary/:date, or /collect/:date.
  const isLectionary = path.startsWith('/lectionary');
  const isCollect = path.startsWith('/collect');
  const hourParam: string = isLectionary
    ? 'lectionary'
    : isCollect
      ? 'collect'
      : (params.hour as string);

  const [data, setData] = useState<HourResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [count, setCount] = useState<CountState | null>(null);
  const [showCircles, setShowCircles] = useState(false);

  // Fetch the office
  useEffect(() => {
    setData(null);
    setErr(null);
    const fetcher =
      isCollect ? api.collect(dateParam) : api.hour(hourParam, dateParam);
    fetcher
      .then((r) => {
        setData(r);
        saveOffice(r.hour);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
  }, [hourParam, dateParam, isCollect]);

  // Ping the visit counter once per page
  useEffect(() => {
    if (!data) return;
    api.count(getId(), window.location.pathname)
      .then((c) => setCount(c))
      .catch(() => {});
  }, [data]);

  if (err) {
    return (
      <div class="container padded">
        <p class="has-text-centered">{err}</p>
        <p class="has-text-centered"><a href="/">home</a></p>
      </div>
    );
  }
  if (!data) {
    return <div class="container padded has-text-centered">…</div>;
  }

  const season = data.season;

  return (
    <div class="container padded">
      <Modal open={showCircles} onClose={() => setShowCircles(false)}>
        <div id="explanation" class="box">
          <div>
            <div class="ring-container"><div class="circle" /><div class="ringring" /></div>
            {' '}Current Visitor
          </div>
          <div>
            <div class="ring-container"><div class="circle" /></div>
            {' '}Recent Visitor
          </div>
        </div>
      </Modal>

      <div class="columns is-centered">
        <div class="column is-narrow">
          <div class="has-text-centered">
            <div
              class={`circles ${season}`}
              onClick={() => setShowCircles(true)}
              role="button"
              tabIndex={0}
            >
              {count
                ? <>
                    {Array.from({ length: count.now }).map((_, i) => (
                      <div key={`n${i}`} class="ring-container">
                        <div class="circle" /><div class="ringring" />
                      </div>
                    ))}
                    {Array.from({ length: count.recent }).map((_, i) => (
                      <div key={`r${i}`} class="ring-container"><div class="circle" /></div>
                    ))}
                  </>
                : null}
            </div>

            <div id="heading">
              <a href="/">
                <h2 class={season}>{data.title} | {data.date}</h2>
              </a>
              <h3>{data.hour}</h3>
            </div>

            <div id="content">
              {data.parts.length === 0
                ? 'Error: No Parts Found'
                : data.parts.map((part, i) => (
                    <span key={part.id ?? `${part.title ?? 'p'}-${i}`}>
                      <div class="officetext has-text-left" data-id={part.id}>
                        {part.title ? <h3 class={`has-text-left ${season}`}>{part.title}</h3> : null}
                        <div dangerouslySetInnerHTML={{ __html: part.text }} />
                      </div>
                      <hr />
                    </span>
                  ))}
              <a href="/" class={season}>home</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
