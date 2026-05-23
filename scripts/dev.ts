/**
 * Dev orchestrator: runs the client bundler in watch mode and the Express
 * server in restart-on-change mode, then forwards SIGINT/SIGTERM to both so
 * Ctrl+C tears the whole tree down cleanly.
 *
 * Run via `bun run dev`.
 */

const buildClient = Bun.spawn(
  [
    'bun', 'build', './client/app.tsx',
    '--outdir', './public/js',
    '--target', 'browser',
    '--entry-naming', '[name].js',
    '--define', 'process.env.NODE_ENV="development"',
    '--sourcemap=linked',
    '--watch',
  ],
  { stdout: 'inherit', stderr: 'inherit' },
);

const server = Bun.spawn(
  ['bun', '--watch', 'run', 'src/prayer-app.ts'],
  {
    stdout: 'inherit',
    stderr: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' },
  },
);

const killAll = (): void => {
  try { buildClient.kill(); } catch { /* ignore */ }
  try { server.kill(); } catch { /* ignore */ }
};

process.on('SIGINT',  () => { killAll(); process.exit(0); });
process.on('SIGTERM', () => { killAll(); process.exit(0); });

// If either child dies, take the whole orchestrator down.
await Promise.race([buildClient.exited, server.exited]);
killAll();
process.exit(0);
