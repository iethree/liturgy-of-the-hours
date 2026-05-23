import { useEffect, useState } from 'preact/hooks';
import { fmtDateKey, fmtLongDate, getHour, isToday, parseISO } from '../dates.ts';
import { api } from '../api.ts';
import { Modal } from './Modal.tsx';
import type { Version } from '../types.ts';

const OFFICES: Record<Version, readonly string[]> = {
  full: ['Lauds', 'Terce', 'Sext', 'None', 'Vespers', 'Compline', 'Matins', 'Lectionary'],
  lite: ['Morning', 'Noon', 'Evening'],
};

function loadVersion(): Version {
  const v = localStorage.getItem('version');
  if (v === 'full' || v === 'lite') return v;
  localStorage.setItem('version', 'lite');
  return 'lite';
}

function applyVersionFromQuery(): Version {
  const params = new URLSearchParams(window.location.search);
  const v = params.get('v');
  if (v) {
    const cleaned: Version = v.toLowerCase() === 'full' ? 'full' : 'lite';
    localStorage.setItem('version', cleaned);
    window.history.replaceState({}, '', window.location.pathname);
    return cleaned;
  }
  return loadVersion();
}

function loadVisitedToday(): string[] {
  const today = localStorage.getItem('today');
  const offices = localStorage.getItem('offices');
  if (!today || !offices) return [];
  return isToday(parseISO(today)) ? offices.split(',').filter(Boolean) : [];
}

function currentOffice(version: Version, date: Date): string {
  const hour = getHour(date);
  if (version === 'lite') {
    if (hour >= 3 && hour < 11) return 'Morning';
    if (hour < 16) return 'Noon';
    return 'Evening';
  }
  if (hour >= 4 && hour < 8) return 'Lauds';
  if (hour >= 8 && hour < 11) return 'Terce';
  if (hour >= 11 && hour < 14) return 'Sext';
  if (hour >= 14 && hour < 16) return 'None';
  if (hour >= 16 && hour < 20) return 'Vespers';
  if (hour >= 20 && hour < 24) return 'Compline';
  return 'Matins';
}

export function Home() {
  const today = new Date();
  const todayKey = fmtDateKey(today);
  const dateLabel = fmtLongDate(today);

  const [version, setVersion] = useState<Version>(() => applyVersionFromQuery());
  const [season, setSeason] = useState<string>(() => localStorage.getItem('season') ?? '');
  const [aboutOpen, setAboutOpen] = useState(false);
  const visited = loadVisitedToday();
  const offices = OFFICES[version];
  const active = currentOffice(version, today);

  useEffect(() => {
    api.season().then((s) => {
      setSeason(s);
      localStorage.setItem('season', s);
    }).catch(() => {});
  }, []);

  const toggleVersion = (e: Event) => {
    e.preventDefault();
    const next: Version = version === 'lite' ? 'full' : 'lite';
    localStorage.setItem('version', next);
    setVersion(next);
  };

  return (
    <div class="container padded">
      <div class="columns is-centered is-mobile">
        <div class="column is-narrow has-text-centered">
          <h1 class={season}>Liturgy of the Hours</h1>
          <h3 id="date">{dateLabel}</h3>
        </div>
      </div>

      <div class="columns is-centered is-mobile">
        <div id="cache-status" class={`column is-10-mobile is-4-tablet is-4-desktop ${season}`}>
          <progress value={0} max={100} class="progress" />
        </div>
      </div>

      <div class="columns is-centered is-mobile">
        <div id="buttonList" class="buttonList">
          {offices.map((o) => (
            <a
              key={o}
              id={o}
              href={`/hour/${o}/${todayKey}/`}
              class={`button is-block ${o === active ? `active ${season}` : ''}`}
            >
              {o}{' '}
              {visited.includes(o) ? <i class="fas fa-check done-check" aria-hidden="true" /> : null}
            </a>
          ))}
          <div className="flex">
            <a
              id="collect"
              href={`/collect/${todayKey}/`}
              class="button is-block"
              aria-label="Collect of the day"
            >
              Collect
            </a>
            <a id="random" href="/hour/random/" class="button is-block" aria-label="Random">
              <i class="fas fa-random" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div class="has-text-centered is-mobile">
        <div class="site-controls">
          <a id="version" class={season} href="#" role="button" tabIndex={0} onClick={toggleVersion}>
            {version === 'lite' ? 'full' : 'lite'}
          </a>
          <span>|</span>
          <a id="about" class={season} href="#" role="button" tabIndex={0} onClick={(e) => { e.preventDefault(); setAboutOpen(true); }}>
            about
          </a>
        </div>
      </div>

      <Modal open={aboutOpen} onClose={() => setAboutOpen(false)}>
        <AboutContent />
      </Modal>
    </div>
  );
}

function AboutContent() {
  return (
    <div class="content">
      <h3>About</h3>
      <p>The Book of Common Prayer is <em>common</em> in two senses. First, in that it is aimed at the common person — not just for religious professionals or the very pious. Second, it is common in that it is meant to be used by people together — we are meant to have our prayers in common.</p>
      <p>For more than a few reasons, the daily offices in the Book of Common Prayer are less common than they once were. It is less feasible for each of us to make our way to the village church a few times a day to pray together. We have also been shaped by a world of technology and bite-size information that carves our time into many small chunks rather than few large ones.</p>
      <p>Drawing on the ancient monastic tradition of attending many prayer services throughout the day, this liturgy of the hours is divided into seven short (3–5 minute) prayer services.</p>
    </div>
  );
}
