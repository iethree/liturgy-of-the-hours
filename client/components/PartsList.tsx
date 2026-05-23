import { useEffect, useState } from 'preact/hooks';
import { useRoute } from 'preact-iso';
import { api, type HourPart, type PartsListResponse } from '../api.ts';

type TagField = 'times' | 'themes';

interface TagSetButtonProps {
  id: string;
  field: TagField;
  option: string;
  active: boolean;
  onToggled: (active: boolean) => void;
}

function TagButton({ id, field, option, active, onToggled }: TagSetButtonProps) {
  const [loading, setLoading] = useState(false);
  const [on, setOn] = useState(active);

  const click = async () => {
    setLoading(true);
    try {
      const r = on
        ? await api.removeTag({ id, field, tag: option })
        : await api.addTag({ id, field, tag: option });
      if (r.ok) {
        const next = !on;
        setOn(next);
        onToggled(next);
      }
    } finally {
      setLoading(false);
    }
  };

  const cls = ['button', 'is-small', 'tag-btn'];
  if (on) cls.push('is-dark');
  if (loading) cls.push('is-loading');

  return (
    <button type="button" class={cls.join(' ')} onClick={click} data-id={id} data-category={field}>
      {option}
    </button>
  );
}

function TagSet({ id, field, current, options }: { id: string; field: TagField; current: string[]; options: string[] }) {
  return (
    <div class="buttons tag-buttons">
      {options.map((option) => (
        <TagButton
          key={option}
          id={id}
          field={field}
          option={option}
          active={current.includes(option)}
          onToggled={() => { /* state lives in TagButton */ }}
        />
      ))}
    </div>
  );
}

function PartCard({ part, taglist }: { part: HourPart; taglist: PartsListResponse['taglist'] }) {
  return (
    <div class="has-text-left box">
      <h3 class="title is-5">{part.title}</h3>
      <h4 class="subtitle is-5">{part.subtitle}</h4>
      <div class="officetext" dangerouslySetInnerHTML={{ __html: part.text }} />
      <div>
        <TagSet id={part.id ?? ''} field="times" current={(part as unknown as { times?: string[] }).times ?? []} options={taglist.times} />
        <TagSet id={part.id ?? ''} field="themes" current={(part as unknown as { themes?: string[] }).themes ?? []} options={taglist.themes} />
      </div>
    </div>
  );
}

export function PartsList() {
  const { params } = useRoute();
  const part = params.part as string;
  const [data, setData] = useState<PartsListResponse | null>(null);

  useEffect(() => {
    setData(null);
    api.partsList(part).then(setData).catch(() => setData({ title: part, parts: [], taglist: { times: [], themes: [] } }));
  }, [part]);

  if (!data) return <div class="container padded has-text-centered">…</div>;

  return (
    <div class="container padded">
      <div class="columns is-centered">
        <div class="column is-narrow">
          <div class="has-text-centered">
            <a href="/list"><h2>{data.title} ({data.parts.length})</h2></a>
            {data.parts.map((p, i) => (
              <PartCard key={p.id ?? i} part={p} taglist={data.taglist} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
