import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

const DATABASE_URL = 'postgresql://covertree:covertree@localhost:5432/covertree';

describe('parseEnv', () => {
  it('applies the SPEC §6 defaults', () => {
    const env = parseEnv({ DATABASE_URL, WEATHERSTACK_API_KEY: 'key' });

    expect(env).toEqual({
      DATABASE_URL,
      WEATHER_PROVIDER: 'weatherstack',
      WEATHERSTACK_API_KEY: 'key',
      WEATHERSTACK_BASE_URL: 'https://api.weatherstack.com',
      WEATHERSTACK_TIMEOUT_MS: 5000,
      PORT: 4000,
      CORS_ORIGIN: 'http://localhost:5173',
      NODE_ENV: 'production',
    });
  });

  it('defaults NODE_ENV to production, so error details stay masked unless dev is explicit', () => {
    expect(parseEnv({ DATABASE_URL, WEATHERSTACK_API_KEY: 'key' }).NODE_ENV).toBe('production');
    expect(
      parseEnv({ DATABASE_URL, WEATHERSTACK_API_KEY: 'key', NODE_ENV: 'development' }).NODE_ENV,
    ).toBe('development');
  });

  it('parses numeric variables from strings', () => {
    const env = parseEnv({
      DATABASE_URL,
      WEATHERSTACK_API_KEY: 'key',
      WEATHERSTACK_TIMEOUT_MS: '2500',
      PORT: '8080',
    });

    expect(env.WEATHERSTACK_TIMEOUT_MS).toBe(2500);
    expect(env.PORT).toBe(8080);
  });

  it('requires DATABASE_URL', () => {
    expect(() => parseEnv({ WEATHERSTACK_API_KEY: 'key' })).toThrow(/DATABASE_URL/);
  });

  it.each([undefined, ''])(
    'requires WEATHERSTACK_API_KEY for the weatherstack provider (%j)',
    (key) => {
      expect(() => parseEnv({ DATABASE_URL, WEATHERSTACK_API_KEY: key })).toThrow(
        /WEATHERSTACK_API_KEY/,
      );
    },
  );

  it('does not require WEATHERSTACK_API_KEY when WEATHER_PROVIDER=fake', () => {
    const env = parseEnv({ DATABASE_URL, WEATHER_PROVIDER: 'fake' });

    expect(env.WEATHER_PROVIDER).toBe('fake');
  });

  it.each([
    ['WEATHER_PROVIDER', 'openweather'],
    ['WEATHERSTACK_TIMEOUT_MS', '0'],
    ['WEATHERSTACK_TIMEOUT_MS', 'soon'],
    ['PORT', '70000'],
    ['WEATHERSTACK_BASE_URL', 'not a url'],
  ])('rejects an invalid %s (%s)', (name, value) => {
    expect(() => parseEnv({ DATABASE_URL, WEATHERSTACK_API_KEY: 'key', [name]: value })).toThrow(
      new RegExp(name),
    );
  });

  it('never includes the API key in its error message', () => {
    let message = '';
    try {
      parseEnv({ WEATHERSTACK_API_KEY: 'secret-key-123' });
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toMatch(/DATABASE_URL/);
    expect(message).not.toContain('secret-key-123');
  });
});
