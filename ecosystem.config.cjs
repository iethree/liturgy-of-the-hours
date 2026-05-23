/**
 * PM2 ecosystem file for running the Liturgy of the Hours server under Bun.
 *
 * Usage:
 *   bun run build-client          # produce ./public/js bundles first
 *   pm2 start ecosystem.config.cjs
 *   pm2 logs liturgy-of-the-hours
 *   pm2 restart liturgy-of-the-hours
 *   pm2 stop liturgy-of-the-hours
 *
 * Environment-specific start:
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 start ecosystem.config.cjs --env development
 *
 * `interpreter` is resolved on the PATH PM2 sees. If `pm2` was started from a
 * shell without Bun on $PATH (common when PM2 is launched at boot via
 * `pm2 startup`), set the absolute path explicitly, e.g.:
 *   BUN_PATH=/home/ryan/.bun/bin/bun pm2 start ecosystem.config.cjs
 */

const path = require('node:path');

const BUN = process.env.BUN_PATH || 'bun';

module.exports = {
  apps: [
    {
      name: 'liturgy-of-the-hours',
      script: 'src/prayer-app.ts',
      cwd: __dirname,

      // Run the TS entry point through Bun directly. Bun executes .ts natively;
      // no compile step is required at start time.
      interpreter: BUN,

      // Bun's threading model doesn't benefit from PM2 cluster mode the way
      // Node does — keep it fork mode and scale horizontally if needed.
      exec_mode: 'fork',
      instances: 1,

      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      kill_timeout: 5000,
      listen_timeout: 8000,
      wait_ready: false,

      // Restart back-off so a crash loop doesn't peg the box.
      min_uptime: '15s',
      max_restarts: 10,
      restart_delay: 2000,

      // Logs
      error_file: path.join(__dirname, 'logs', 'error.log'),
      out_file: path.join(__dirname, 'logs', 'out.log'),
      merge_logs: true,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      env_production: {
        NODE_ENV: 'production',
        PORT: 3040,
      },

      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
    },
  ],
};
