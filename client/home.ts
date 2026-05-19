import { format as dfFormat, isToday, parseISO } from 'date-fns';
import { installThemeToggle } from './theme.ts';
import type { Alarms, AlarmSetting, Version } from './types.ts';

const VAPIDPUBLIC = 'BDGjlxI-5G_q0k910Oez3eCAKlk9CV0t3yY1y4ypeh041Rv4Wgi-EwSpsVvUc4b4m7-dv6tfj6ClyGNTSAxQ3xQ';
const TZ_OFFSET_HOURS = new Date().getTimezoneOffset() / 60;

const DEFAULT_ALARMS: Alarms = {
  Morning: { hr: '07', min: '00', enabled: false },
  Noon: { hr: '12', min: '00', enabled: false },
  Evening: { hr: '18', min: '00', enabled: false },
  Lauds: { hr: '07', min: '00', enabled: false },
  Terce: { hr: '10', min: '00', enabled: false },
  Sext: { hr: '12', min: '00', enabled: false },
  None: { hr: '15', min: '00', enabled: false },
  Vespers: { hr: '18', min: '00', enabled: false },
  Compline: { hr: '21', min: '00', enabled: false },
  Matins: { hr: '22', min: '00', enabled: false },
};

const OFFICES: Record<Version, readonly string[]> = {
  full: ['Lauds', 'Terce', 'Sext', 'None', 'Vespers', 'Compline', 'Matins', 'Lectionary'],
  lite: ['Morning', 'Noon', 'Evening'],
};

let swRegistration: ServiceWorkerRegistration | undefined;
let alarms: Alarms = DEFAULT_ALARMS;

function getId(): string {
  const existing = localStorage.getItem('id');
  if (existing) return existing;
  const id = String(Date.now());
  localStorage.setItem('id', id);
  return id;
}

function loadVisitedToday(): string[] {
  const today = localStorage.getItem('today');
  const offices = localStorage.getItem('offices');
  if (!today || !offices) return [];
  return isToday(parseISO(today)) ? offices.split(',').filter(Boolean) : [];
}

function loadVersion(): Version {
  const v = localStorage.getItem('version');
  if (v === 'full' || v === 'lite') return v;
  localStorage.setItem('version', 'lite');
  return 'lite';
}

function setVersion(v: string): Version {
  const cleaned: Version = v.toLowerCase() === 'full' ? 'full' : 'lite';
  localStorage.setItem('version', cleaned);
  return cleaned;
}

function checkVersion(): Version {
  const params = new URLSearchParams(window.location.search);
  const v = params.get('v');
  if (v) {
    setVersion(v);
    window.history.pushState({}, 'Liturgy of the Hours', '/');
  }
  return loadVersion();
}

function applySeasonClass(season: string): void {
  const safe = season.toLowerCase();
  const targets = ['h1', '.active', '#cache-status', '#about', '#notify', '#version'];
  for (const sel of targets) {
    const el = document.querySelector(sel);
    el?.classList.add(safe);
  }
}

async function fetchSeason(): Promise<void> {
  try {
    const r = await fetch('/season');
    const s = (await r.text()).toLowerCase();
    applySeasonClass(s);
    localStorage.setItem('season', s);
  } catch {
    /* no-op: offline */
  }
}

function makeButton(title: string, date: string, checked: boolean): string {
  const check = checked ? '<i class="fas fa-check done-check" aria-hidden="true"></i>' : '';
  return `<a id='${title}' href='/hour/${title}/${date}/' class='button is-block'>${title} ${check}</a><br>`;
}

function highlightCurrentOffice(version: Version): void {
  const time = findNow(version);
  document.getElementById(time)?.classList.add('active');
}

function findNow(version: Version): string {
  const hour = Number(dfFormat(new Date(), 'H'));
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

function makeButtons(): void {
  const date = new Date();
  const dateEl = document.getElementById('date');
  if (dateEl) dateEl.textContent = dfFormat(date, 'MMMM d');
  const today = dfFormat(date, 'yyyyMMdd');

  const version = checkVersion();
  const visited = loadVisitedToday();
  const offices = OFFICES[version];

  let buttons = '';
  for (const o of offices) buttons += makeButton(o, today, visited.includes(o));
  buttons += `<a id='random' href='/hour/random/' class='button' aria-label='Random'><i class='fas fa-random' aria-hidden='true'></i></a><br>`;

  const versionEl = document.getElementById('version');
  if (versionEl) versionEl.textContent = version === 'lite' ? 'full' : 'lite';

  const buttonList = document.getElementById('buttonList');
  if (buttonList) buttonList.innerHTML = buttons;
  highlightCurrentOffice(version);

  const cachedSeason = localStorage.getItem('season');
  if (cachedSeason) applySeasonClass(cachedSeason);
  void fetchSeason();
}

function toggleModal(): void {
  document.querySelector('.modal')?.classList.toggle('is-active');
}

function showModal(): void {
  if (!document.querySelector('.modal')?.classList.contains('is-active')) toggleModal();
}

function setModal(content: string): void {
  const target = document.getElementById('modal-content');
  if (target) target.innerHTML = content;
  showModal();
}

function showExplanation(): void {
  setModal(`<div class="content">
    <h3>About</h3>
    <p>The Book of Common Prayer is <em>common</em> in two senses. First, in that it is aimed at the common person — not just for religious professionals or the very pious. Second, it is common in that it is meant to be used by people together — we are meant to have our prayers in common.</p>
    <p>For more than a few reasons, the daily offices in the Book of Common Prayer are less common than they once were. It is less feasible for each of us to make our way to the village church a few times a day to pray together. We have also been shaped by a world of technology and bite-size information that carves our time into many small chunks rather than few large ones.</p>
    <p>Drawing on the ancient monastic tradition of attending many prayer services throughout the day, this liturgy of the hours is divided into seven short (3–5 minute) prayer services.</p>
  </div>`);
}

function toggleVersion(): void {
  setVersion(checkVersion() === 'lite' ? 'full' : 'lite');
  makeButtons();
}

function urlB64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function utcAlarms(input: Alarms): Alarms {
  const out: Alarms = {};
  for (const [k, v] of Object.entries(input)) {
    let hr = Number(v.hr) + TZ_OFFSET_HOURS;
    if (hr > 23) hr -= 24;
    if (hr < 0) hr += 24;
    out[k] = { hr, min: v.min, enabled: v.enabled };
  }
  return out;
}

function loadAlarms(): Alarms {
  const stored = localStorage.getItem('alarms');
  if (!stored) return DEFAULT_ALARMS;
  try {
    const parsed = JSON.parse(stored) as unknown;
    if (parsed && typeof parsed === 'object') return parsed as Alarms;
  } catch {
    /* fall through */
  }
  return DEFAULT_ALARMS;
}

function alarmChooser(label: string, val: AlarmSetting): string {
  return `
    <div class="alarm-input" id="alarm-input-${label}">
      <label class="checkbox alarm-label">
        <input type="checkbox" name="check_${label}" data-office="${label}" ${val.enabled ? 'checked' : ''}>
        ${label}
      </label>
      <input class="input is-small ${val.enabled ? '' : 'hidden'}" type="time" name="alarm_${label}" id="alarm_${label}"
        data-office="${label}"
        value="${val.hr}:${val.min}" step="900"
        title="please enter a time in quarter-hour increments">
    </div>`;
}

function showAlarmSettings(): string {
  const version = loadVersion();
  const offices = OFFICES[version];
  return offices.map((o) => alarmChooser(o, alarms[o] ?? DEFAULT_ALARMS[o]!)).join('');
}

function attachAlarmHandlers(): void {
  document.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-office]').forEach((cb) => {
    cb.addEventListener('click', (e) => {
      const office = (e.currentTarget as HTMLInputElement).dataset['office'];
      if (!office || !alarms[office]) return;
      alarms[office].enabled = !alarms[office].enabled;
      const container = document.getElementById('alarm-input-' + office);
      if (container) container.outerHTML = alarmChooser(office, alarms[office]);
      attachAlarmHandlers();
    });
  });
  document.querySelectorAll<HTMLInputElement>('input[type="time"][data-office]').forEach((inp) => {
    inp.addEventListener('change', (e) => {
      const target = e.currentTarget as HTMLInputElement;
      const office = target.dataset['office'];
      if (!office || !alarms[office]) return;
      const parts = target.value.split(':');
      const hr = parts[0];
      const min = parts[1];
      if (hr !== undefined) alarms[office].hr = hr;
      if (min !== undefined) alarms[office].min = min;
    });
  });
}

async function configureNotifications(): Promise<void> {
  if (!('Notification' in window)) {
    setModal('Sorry, your browser does not support web push notifications.');
    return;
  }
  const status = await Notification.requestPermission();
  if (status === 'granted') showNotificationSettings();
  else showBlockedNotice();
}

function showBlockedNotice(): void {
  setModal(`<div class="has-text-left">
    <i class="fas fa-exclamation-triangle"></i>&nbsp;
    You have blocked notifications from this site. Please
    <a href="https://www.google.com/search?q=how+to+enable+browser+notifications">enable them in your browser's settings</a>
    to use this feature.
  </div>`);
}

async function showNotificationSettings(): Promise<void> {
  alarms = loadAlarms();
  if (!swRegistration) return;
  const subscription = await swRegistration.pushManager.getSubscription();
  if (!subscription) {
    setModal(`<div class="has-text-centered"><button id="do-subscribe" class="button is-primary">Subscribe to Notifications</button></div>`);
    document.getElementById('do-subscribe')?.addEventListener('click', () => subscribe());
    return;
  }
  const seasonClass = localStorage.getItem('season') ?? '';
  setModal(`
    <div>
      <h3>Notification Settings</h3>
      ${showAlarmSettings()}
      <div class="buttons is-right">
        <button id="save" class="button ${seasonClass}">Save</button>
        <button id="do-unsubscribe" class="button">Unsubscribe</button>
      </div>
    </div>`);
  attachAlarmHandlers();
  document.getElementById('save')?.addEventListener('click', () => saveAlarms());
  document.getElementById('do-unsubscribe')?.addEventListener('click', () => unsubscribe());
}

async function subscribe(): Promise<void> {
  if (!swRegistration) return;
  try {
    const subscription = await swRegistration.pushManager.subscribe({
      applicationServerKey: urlB64ToUint8Array(VAPIDPUBLIC),
      userVisibleOnly: true,
    });
    await fetch('/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: getId(), alarms: utcAlarms(alarms), subscription }),
    });
    void showNotificationSettings();
  } catch (e: unknown) {
    console.error('subscribe failed', e);
  }
}

async function unsubscribe(): Promise<void> {
  if (!swRegistration) return;
  const subscription = await swRegistration.pushManager.getSubscription();
  if (subscription) {
    await fetch('/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: getId() }),
    });
    await subscription.unsubscribe();
  }
  void showNotificationSettings();
}

async function saveAlarms(): Promise<void> {
  localStorage.setItem('alarms', JSON.stringify(alarms));
  const saveButton = document.getElementById('save');
  saveButton?.classList.add('is-loading');
  try {
    await fetch('/alarms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: getId(), alarms: utcAlarms(alarms) }),
    });
    if (saveButton) {
      saveButton.classList.remove('is-loading');
      saveButton.textContent = 'Saved!';
    }
    setTimeout(() => {
      toggleModal();
      if (saveButton) saveButton.textContent = 'Save';
    }, 500);
  } catch (e: unknown) {
    console.error('save failed', e);
  }
}

function init(): void {
  installThemeToggle();
  getId();
  makeButtons();

  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.register('/service-worker.js').then((r) => {
      swRegistration = r;
    });
  }

  ['.modal-background', '.modal-close'].forEach((sel) => {
    document.querySelector(sel)?.addEventListener('click', toggleModal);
  });
  document.getElementById('about')?.addEventListener('click', showExplanation);
  document.getElementById('version')?.addEventListener('click', toggleVersion);
  document.getElementById('notify')?.addEventListener('click', () => void configureNotifications());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
