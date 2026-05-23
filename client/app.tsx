import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';
import { Layout } from './components/Layout.tsx';
import { Home } from './components/Home.tsx';
import { Hour } from './components/Hour.tsx';
import { PartsIndex } from './components/PartsIndex.tsx';
import { PartsList } from './components/PartsList.tsx';
import { NotFound } from './components/NotFound.tsx';
import { tearDownServiceWorkers } from './util.ts';

function App() {
  return (
    <LocationProvider>
      <Layout>
        <Router>
          <Route path="/" component={Home} />
          <Route path="/hour/:hour" component={Hour} />
          <Route path="/hour/:hour/:date" component={Hour} />
          <Route path="/lectionary" component={Hour} />
          <Route path="/lectionary/:date" component={Hour} />
          <Route path="/collect" component={Hour} />
          <Route path="/collect/:date" component={Hour} />
          <Route path="/list" component={PartsIndex} />
          <Route path="/list/:part" component={PartsList} />
          <Route default component={NotFound} />
        </Router>
      </Layout>
    </LocationProvider>
  );
}

// Boot
const root = document.getElementById('app');
if (root) render(<App />, root);

// We no longer ship a service worker. Unregister any old one + nuke its caches
// so existing installs reach a clean state on next visit.
void tearDownServiceWorkers();

// Dev-only auto-reload. The `process.env.NODE_ENV` literal is replaced at
// build time by Bun's --define; in production this whole block is
// dead-code-eliminated and never reaches the bundle.
if (process.env.NODE_ENV !== 'production') {
  const es = new EventSource('/__dev/reload');
  es.addEventListener('reload', () => {
    // eslint-disable-next-line no-console
    console.log('[dev] reload');
    location.reload();
  });
  // The browser will auto-retry on disconnect; nothing to do on `error`.
}
