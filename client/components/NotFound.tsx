import { useEffect } from 'preact/hooks';
import { useLocation } from 'preact-iso';

export function NotFound() {
  const { route } = useLocation();
  useEffect(() => { route('/', true); }, [route]);
  return <div class="container padded has-text-centered">Redirecting…</div>;
}
