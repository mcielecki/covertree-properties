import { describe, expect, it } from 'vitest';
import {
  assertTestDatabaseUrl,
  DEFAULT_TEST_DATABASE_URL,
  resolveTestDatabaseUrl,
} from './test-database.js';

describe('assertTestDatabaseUrl', () => {
  it.each([
    'postgresql://covertree:covertree@localhost:5432/covertree_test',
    'postgres://u:p@db:5432/other_test?schema=public',
  ])('accepts %s', (url) => {
    expect(assertTestDatabaseUrl(url)).toBe(url);
  });

  it.each([
    ['the dev database', 'postgresql://covertree:covertree@localhost:5432/covertree'],
    ['the e2e database', 'postgresql://covertree:covertree@localhost:5432/covertree_e2e'],
    ['a name that only contains _test', 'postgresql://u:p@localhost:5432/covertree_test_copy'],
    ['a name ending in "test" without underscore', 'postgresql://u:p@localhost:5432/covertreetest'],
    ['no database name', 'postgresql://u:p@localhost:5432/'],
    [
      '_test only in the query string',
      'postgresql://u:p@localhost:5432/covertree?x=covertree_test',
    ],
  ])('refuses %s', (_label, url) => {
    expect(() => assertTestDatabaseUrl(url)).toThrow(/must end with "_test"/);
  });

  it('refuses a malformed URL', () => {
    expect(() => assertTestDatabaseUrl('not a url')).toThrow(
      /TEST_DATABASE_URL is not a valid URL/,
    );
  });

  it('never echoes the password in its message', () => {
    const error = captureError(() =>
      assertTestDatabaseUrl('postgresql://u:s3cret@localhost:5432/covertree'),
    );
    expect(error.message).toMatch(/must end with "_test"/);
    expect(error.message).not.toContain('s3cret');
  });
});

describe('resolveTestDatabaseUrl', () => {
  it('prefers TEST_DATABASE_URL from the environment', () => {
    const url = 'postgresql://a:b@localhost:5432/from_env_test';
    expect(resolveTestDatabaseUrl({ TEST_DATABASE_URL: url }, { TEST_DATABASE_URL: 'x' })).toBe(
      url,
    );
  });

  it('falls back to TEST_DATABASE_URL from the .env file', () => {
    const url = 'postgresql://a:b@localhost:5432/from_file_test';
    expect(resolveTestDatabaseUrl({}, { TEST_DATABASE_URL: url })).toBe(url);
  });

  it('falls back to the compose default', () => {
    expect(resolveTestDatabaseUrl({}, {})).toBe(DEFAULT_TEST_DATABASE_URL);
    expect(DEFAULT_TEST_DATABASE_URL).toBe(
      'postgresql://covertree:covertree@localhost:5432/covertree_test',
    );
  });

  it('never falls back to DATABASE_URL', () => {
    const dev = 'postgresql://covertree:covertree@localhost:5432/covertree';
    expect(resolveTestDatabaseUrl({ DATABASE_URL: dev }, { DATABASE_URL: dev })).toBe(
      DEFAULT_TEST_DATABASE_URL,
    );
  });

  it('applies the guard to whatever it resolves', () => {
    expect(() =>
      resolveTestDatabaseUrl(
        { TEST_DATABASE_URL: 'postgresql://a:b@localhost:5432/covertree' },
        {},
      ),
    ).toThrow(/must end with "_test"/);
  });
});

function captureError(fn: () => unknown): Error {
  try {
    fn();
  } catch (error) {
    if (error instanceof Error) return error;
  }
  throw new Error('expected the function to throw an Error');
}
