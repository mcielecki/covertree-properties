import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// E2E runs migrate and truncate their database. This module decides which database that is, and
// it deliberately never looks at DATABASE_URL, so a misconfigured shell cannot point it at dev data.

/** Matches the `db` service in docker-compose.yml (host port 5432) and the init script. */
export const DEFAULT_E2E_DATABASE_URL =
  'postgresql://covertree:covertree@localhost:5432/covertree_e2e';

const ROOT_ENV_FILE = new URL('../../../.env', import.meta.url);

type Env = Readonly<Record<string, string | undefined>>;

/** Throws unless the URL's database name ends with "_e2e". Returns the URL unchanged. */
export function assertE2eDatabaseUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('E2E_DATABASE_URL is not a valid URL. Refusing to run E2E tests.');
  }
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  if (!database.endsWith('_e2e')) {
    // Host and database only: the URL may carry a password.
    throw new Error(
      `Refusing to use database "${database}" on ${parsed.host}: ` +
        'the database name in E2E_DATABASE_URL must end with "_e2e". ' +
        'E2E tests delete all data in it.',
    );
  }
  return url;
}

/**
 * E2E_DATABASE_URL from the environment, else from the repo-root .env, else the compose default.
 * Only E2E_DATABASE_URL is ever read from either source.
 */
export function resolveE2eDatabaseUrl(env: Env, envFile: Env): string {
  return assertE2eDatabaseUrl(
    env.E2E_DATABASE_URL || envFile.E2E_DATABASE_URL || DEFAULT_E2E_DATABASE_URL,
  );
}

export function loadE2eDatabaseUrl(): string {
  const envFile = existsSync(ROOT_ENV_FILE) ? parseEnv(readFileSync(ROOT_ENV_FILE, 'utf8')) : {};
  return resolveE2eDatabaseUrl(process.env, envFile);
}
