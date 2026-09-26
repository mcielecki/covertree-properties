import { defineConfig, devices } from '@playwright/test';
import { loadE2eDatabaseUrl } from './e2e/e2e-database';

// Dedicated ports, never reused: an already running `pnpm dev` (api :4000, web :5173) talks to the
// dev database, and reusing it would let the smoke flow write there.
const API_PORT = 4100;
const WEB_PORT = 5174;
const WEB_URL = `http://localhost:${WEB_PORT}`;

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? 'line' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      name: 'api',
      // Binaries directly, not via `pnpm exec`: its child outlived Playwright's teardown.
      command: 'node_modules/.bin/tsx src/main.ts',
      cwd: '../api',
      url: `http://localhost:${API_PORT}/health`,
      reuseExistingServer: false,
      env: {
        DATABASE_URL: loadE2eDatabaseUrl(),
        WEATHER_PROVIDER: 'fake',
        PORT: String(API_PORT),
        CORS_ORIGIN: WEB_URL,
        NODE_ENV: 'test',
      },
      // main.ts closes the server and disconnects Prisma on SIGTERM.
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
    },
    {
      name: 'web',
      command: `node_modules/.bin/vite --port ${WEB_PORT} --strictPort`,
      url: WEB_URL,
      reuseExistingServer: false,
      env: { VITE_GRAPHQL_URL: `http://localhost:${API_PORT}/graphql` },
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
    },
  ],
});
