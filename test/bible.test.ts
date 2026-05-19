import { describe, test, expect, beforeEach } from 'bun:test';
import { createBible } from '../src/bible.ts';

interface FetchCall {
  url: string;
  init?: RequestInit;
}

function buildFetch(handler: (call: FetchCall) => Response | Promise<Response>) {
  const calls: FetchCall[] = [];
  const impl = (async (input: URL | RequestInfo, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const call: FetchCall = init ? { url, init } : { url };
    calls.push(call);
    return handler(call);
  }) as typeof fetch;
  return { impl, calls };
}

describe('bible.get', () => {
  test('caches an ESV result and serves it from NeDB on the next call', async () => {
    const { impl, calls } = buildFetch(() =>
      Response.json({ canonical: 'Psalm 1', passages: ['<p>blessed is the man</p>'] }),
    );

    const bible = createBible({ dbPath: ':memory:', esvKey: 'fake', fetchImpl: impl });

    const first = await bible.get('psalm1');
    expect(first.title).toBe('Psalm 1');
    expect(first.text).toContain('blessed');

    // small delay to let the cache write commit
    await new Promise((r) => setTimeout(r, 10));

    const second = await bible.get('psalm1');
    expect(second.title).toBe('Psalm 1');
    // Only the first call should have hit the network.
    expect(calls.length).toBe(1);
  });

  test('rejects when the ESV returns no passage', async () => {
    const { impl } = buildFetch(() => Response.json({ canonical: '', passages: [] }));
    const bible = createBible({ dbPath: ':memory:', esvKey: 'fake', fetchImpl: impl });
    await expect(bible.get('not a real reference')).rejects.toThrow();
  });

  test('rejects when ESV responds non-200', async () => {
    const { impl } = buildFetch(() => new Response('forbidden', { status: 403 }));
    const bible = createBible({ dbPath: ':memory:', esvKey: 'fake', fetchImpl: impl });
    await expect(bible.get('psalm 1')).rejects.toThrow(/ESV request failed/);
  });

  test('rejects when no ESV key is configured', async () => {
    const { impl } = buildFetch(() => Response.json({ canonical: 'x', passages: ['y'] }));
    const bible = createBible({ dbPath: ':memory:', esvKey: '', fetchImpl: impl });
    await expect(bible.get('psalm 1')).rejects.toThrow(/ESV_KEY/);
  });

  test('sanitizes en-dashes and bracket noise before hitting ESV', async () => {
    let lastUrl = '';
    const { impl } = buildFetch((call) => {
      lastUrl = call.url;
      return Response.json({ canonical: 'Psalm 1', passages: ['<p>x</p>'] });
    });
    const bible = createBible({ dbPath: ':memory:', esvKey: 'fake', fetchImpl: impl });
    await bible.get('Psalm 1–2');
    expect(lastUrl).toContain('Psalm%201-2');
    expect(lastUrl).not.toContain('%E2%80%93'); // no en-dash survived
  });

  test('randomProverb returns a passage from Proverbs', async () => {
    let receivedUrl = '';
    const { impl } = buildFetch((call) => {
      receivedUrl = call.url;
      return Response.json({ canonical: 'Proverbs 3:5', passages: ['<p>trust...</p>'] });
    });
    const bible = createBible({ dbPath: ':memory:', esvKey: 'fake', fetchImpl: impl });
    const result = await bible.randomProverb();
    expect(result.title).toBe('Proverbs 3:5');
    expect(receivedUrl.toLowerCase()).toContain('proverbs');
  });
});
