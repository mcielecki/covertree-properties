import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { TestProject } from 'vitest/node';
import { loadTestDatabaseUrl } from './helpers/test-database.js';

declare module 'vitest' {
  export interface ProvidedContext {
    testDatabaseUrl: string;
  }
}

const API_ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * Applies pending migrations to the test database, once per run. `migrate deploy` is not
 * destructive (Prisma refuses `migrate reset` from AI agents); tests truncate before each case.
 */
export default function setup(project: TestProject): void {
  // Throws unless the database name ends with "_test". Never derived from DATABASE_URL.
  const testDatabaseUrl = loadTestDatabaseUrl();

  // The Prisma CLI reads its URL from DATABASE_URL (prisma.config.ts). It is set here for the
  // child process only, and dotenv there does not override a variable that is already set.
  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: API_ROOT,
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: ['ignore', 'ignore', 'inherit'],
  });

  project.provide('testDatabaseUrl', testDatabaseUrl);
}
