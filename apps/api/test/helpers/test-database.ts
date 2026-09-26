import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'dotenv';

// Integration tests migrate and truncate their database. This module decides which database that
// is, and it deliberately never looks at DATABASE_URL, so a misconfigured shell cannot point it
// at dev data.

/** Matches the `db` service in docker-compose.yml (host port 5432) and the init script. */
export const DEFAULT_TEST_DATABASE_URL =
  'postgresql://covertree:covertree@localhost:5432/covertree_test';

const ROOT_ENV_FILE = new URL('../../../../.env', import.meta.url);

type Env = Readonly<Record<string, string | undefined>>;

/** Throws unless the URL's database name ends with "_test". Returns the URL unchanged. */
export function assertTestDatabaseUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('TEST_DATABASE_URL is not a valid URL. Refusing to run integration tests.');
  }
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  if (!database.endsWith('_test')) {
    // Host and database only: the URL may carry a password.
    throw new Error(
      `Refusing to use database "${database}" on ${parsed.host}: ` +
        'the database name in TEST_DATABASE_URL must end with "_test". ' +
        'Integration tests delete all data in it.',
    );
  }
  return url;
}

/**
 * TEST_DATABASE_URL from the environment, else from the repo-root .env, else the compose default.
 * Only TEST_DATABASE_URL is ever read from either source.
 */
export function resolveTestDatabaseUrl(env: Env, envFile: Env): string {
  return assertTestDatabaseUrl(
    env.TEST_DATABASE_URL || envFile.TEST_DATABASE_URL || DEFAULT_TEST_DATABASE_URL,
  );
}

export function loadTestDatabaseUrl(): string {
  const envFile = existsSync(ROOT_ENV_FILE) ? parse(readFileSync(ROOT_ENV_FILE)) : {};
  return resolveTestDatabaseUrl(process.env, envFile);
}
