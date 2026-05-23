import { useEffect, useState } from 'preact/hooks';
import { api } from '../api.ts';

export function PartsIndex() {
  const [parts, setParts] = useState<string[] | null>(null);

  useEffect(() => {
    api.partsIndex().then(setParts).catch(() => setParts([]));
  }, []);

  return (
    <div class="container padded">
      <div class="columns is-centered is-mobile">
        <div class="column is-12-mobile is-6-tablet is-6-desktop">
          <div class="has-text-centered">
            <a href="/"><h1>Liturgy of the Hours Parts</h1></a>
            <div class="buttons is-centered">
              {parts === null
                ? '…'
                : parts.map((part) => (
                    <a key={part} href={`/list/${part.toLowerCase()}`} class="button">{part}</a>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
