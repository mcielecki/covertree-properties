import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadE2eDatabaseUrl } from './e2e-database';

const API_ROOT = fileURLToPath(new URL('../../api', import.meta.url));

/**
 * Migrates and empties the E2E database once per run. Uses the api's Prisma CLI, which reads its
 * URL from DATABASE_URL (prisma.config.ts); it is set here for the child processes only.
 */
export default function globalSetup(): void {
  // Throws unless the database name ends with "_e2e". Never derived from DATABASE_URL.
  const env = { ...process.env, DATABASE_URL: loadE2eDatabaseUrl() };
  const prisma = (args: string[], input?: string) =>
    execFileSync('pnpm', ['exec', 'prisma', ...args], {
      cwd: API_ROOT,
      env,
      input,
      stdio: [input === undefined ? 'ignore' : 'pipe', 'ignore', 'inherit'],
    });

  prisma(['migrate', 'deploy']);
  prisma(['db', 'execute', '--stdin'], 'TRUNCATE TABLE properties');
}
