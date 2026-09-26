import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // e2e/*.test.ts are unit tests of E2E helpers; Playwright's own files are e2e/*.spec.ts.
    include: ['src/**/*.test.{ts,tsx}', 'e2e/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    // Dates render in the local time zone; pin it so assertions are deterministic.
    env: { TZ: 'UTC' },
  },
});
