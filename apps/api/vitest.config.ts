import { defineConfig } from 'vitest/config';

// Vite would resolve `graphql` for our source to its ESM build (package.json "module"), while
// graphql-yoga, loaded by Node, gets the CJS "main". Two copies break `instanceof GraphQLError`.
// Pin ours to the file Node picks, as it is at runtime.
const resolve = { alias: [{ find: /^graphql$/, replacement: 'graphql/index.js' }] };

export default defineConfig({
  test: {
    projects: [
      {
        resolve,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts', 'test/helpers/**/*.test.ts'],
        },
      },
      {
        resolve,
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
