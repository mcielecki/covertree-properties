import { describe, expect, it } from 'vitest';
import {
  assertE2eDatabaseUrl,
  DEFAULT_E2E_DATABASE_URL,
  resolveE2eDatabaseUrl,
} from './e2e-database';

describe('assertE2eDatabaseUrl', () => {
  it('accepts a database whose name ends with "_e2e"', () => {
    const url = 'postgresql://u:p@localhost:5432/covertree_e2e';
    expect(assertE2eDatabaseUrl(url)).toBe(url);
  });

  it.each([
    'postgresql://u:p@localhost:5432/covertree',
    'postgresql://u:p@localhost:5432/covertree_test',
    'postgresql://u:p@localhost:5432/covertree_e2e_old',
  ])('rejects %s', (url) => {
    expect(() => assertE2eDatabaseUrl(url)).toThrow(/must end with "_e2e"/);
  });

  it('rejects a value that is not a URL', () => {
    expect(() => assertE2eDatabaseUrl('not a url')).toThrow(/not a valid URL/);
  });

  it('never puts the password in the error message', () => {
    expect(() => assertE2eDatabaseUrl('postgresql://u:s3cret@localhost:5432/covertree')).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining('s3cret') as string }),
    );
  });
});

describe('resolveE2eDatabaseUrl', () => {
  const fromEnv = 'postgresql://u:p@localhost:5432/env_e2e';
  const fromFile = 'postgresql://u:p@localhost:5432/file_e2e';

  it('prefers the environment over the .env file', () => {
    expect(
      resolveE2eDatabaseUrl({ E2E_DATABASE_URL: fromEnv }, { E2E_DATABASE_URL: fromFile }),
    ).toBe(fromEnv);
  });

  it('falls back to the .env file, then to the compose default', () => {
    expect(resolveE2eDatabaseUrl({}, { E2E_DATABASE_URL: fromFile })).toBe(fromFile);
    expect(resolveE2eDatabaseUrl({}, {})).toBe(DEFAULT_E2E_DATABASE_URL);
  });

  it('never falls back to DATABASE_URL', () => {
    expect(
      resolveE2eDatabaseUrl(
        { DATABASE_URL: 'postgresql://u:p@localhost:5432/covertree' },
        { DATABASE_URL: 'postgresql://u:p@localhost:5432/covertree' },
      ),
    ).toBe(DEFAULT_E2E_DATABASE_URL);
  });

  it('validates the resolved URL', () => {
    expect(() =>
      resolveE2eDatabaseUrl({ E2E_DATABASE_URL: 'postgresql://u:p@localhost/covertree' }, {}),
    ).toThrow(/_e2e/);
  });
});
