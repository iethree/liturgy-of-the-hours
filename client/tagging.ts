import { installThemeToggle } from './theme.ts';

interface TagButtonDataset extends DOMStringMap {
  id?: string;
  category?: string;
}

async function updateTag(event: MouseEvent): Promise<void> {
  const btn = event.currentTarget as HTMLButtonElement | null;
  if (!btn) return;
  const dataset = btn.dataset as TagButtonDataset;
  const id = dataset.id;
  const field = dataset.category;
  if (!id || !field) return;

  const tag = (btn.textContent ?? '').trim();
  const op = btn.classList.contains('is-dark') ? '/removeTag' : '/addTag';

  btn.classList.toggle('is-loading');
  try {
    const r = await fetch(op, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, field, tag }),
    });
    if (r.ok) btn.classList.toggle('is-dark');
  } catch (e: unknown) {
    console.warn('tag update failed', e);
  } finally {
    btn.classList.toggle('is-loading');
  }
}

function init(): void {
  installThemeToggle();
  document.querySelectorAll<HTMLButtonElement>('button.tag-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => void updateTag(e));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
