import { isToday, parseISO } from 'date-fns';
import { installThemeToggle } from './theme.ts';
import { clearCacheStorage } from './no-cache.ts';
import type { CountResponse } from './types.ts';

function getId(): string {
  const existing = localStorage.getItem('id');
  if (existing) return existing;
  const id = String(Date.now());
  localStorage.setItem('id', id);
  return id;
}

function saveOffice(first: boolean): void {
  if (first) localStorage.setItem('today', new Date().toISOString());

  const heading = document.getElementById('heading');
  const thisOffice = heading?.getAttribute('office');
  if (!thisOffice) return;

  const stored = first ? '' : localStorage.getItem('offices') ?? '';
  const todayOffices = stored ? stored.split(',').filter(Boolean) : [];
  if (!todayOffices.includes(thisOffice)) {
    todayOffices.push(thisOffice);
    localStorage.setItem('offices', todayOffices.join(','));
  }
}

function createCircles({ now, recent }: CountResponse): void {
  const pulsing = '<div class="ring-container"><div class="circle"></div><div class="ringring"></div></div>';
  const circle = '<div class="ring-container"><div class="circle"></div></div>';
  let html = '';
  for (let i = 0; i < now; i++) html += pulsing;
  for (let i = 0; i < recent; i++) html += circle;
  const target = document.querySelector('.circles');
  if (target) target.innerHTML = html;
}

async function hereNow(): Promise<void> {
  const today = localStorage.getItem('today');
  const first = !today || !isToday(parseISO(today));
  saveOffice(first);

  try {
    const r = await fetch('/count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: getId(), page: window.location.pathname }),
    });
    const json = (await r.json()) as CountResponse;
    createCircles(json);
  } catch (e: unknown) {
    console.warn('count failed', e);
  }
}

function toggleModal(): void {
  document.querySelector('.modal')?.classList.toggle('is-active');
}

function init(): void {
  installThemeToggle();
  // SW cache was removed; clear any leftover CacheStorage entries on each load.
  void clearCacheStorage();

  // Keep the SW registered so push notifications still work. The SW no longer
  // caches anything — install/activate just wipe old caches and pass through.
  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.register('/service-worker.js');
  }

  ['.modal-background', '.modal-close', '.circles'].forEach((sel) => {
    document.querySelector(sel)?.addEventListener('click', toggleModal);
  });
  void hereNow();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
