import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts', 'test/helpers/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          include: ['test/integration/**/*.test.ts'],
          // Migrates covertree_test once per run; refuses any database not named *_test.
          globalSetup: ['test/global-setup.ts'],
          // Files share one database, so they must not run in parallel.
          fileParallelism: false,
        },
      },
    ],
  },
});
