import { describe, expect, it, vi } from 'vitest';
import { LocationNotFoundError, WeatherUnavailableError } from '../../errors/domain-errors.js';
import type { Logger } from '../../logger.js';
import error101 from './__fixtures__/error-101.json' with { type: 'json' };
import error105 from './__fixtures__/error-105.json' with { type: 'json' };
import error615 from './__fixtures__/error-615.json' with { type: 'json' };
import malformed from './__fixtures__/malformed.json' with { type: 'json' };
import missingRequired from './__fixtures__/missing-required.json' with { type: 'json' };
import nonUs from './__fixtures__/non-us.json' with { type: 'json' };
import successMinimal from './__fixtures__/success-minimal-current.json' with { type: 'json' };
import success from './__fixtures__/success.json' with { type: 'json' };
import { WeatherstackProvider } from './weatherstack.provider.js';

const API_KEY = 'secret-test-key-123';

type Body = Record<string, unknown>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function clone(body: Body): Body {
  return structuredClone(body);
}

function withLocation(patch: Body): Body {
  const body = clone(success);
  body.location = { ...(body.location as Body), ...patch };
  return body;
}

function withCurrent(patch: Body): Body {
  const body = clone(success);
  body.current = { ...(body.current as Body), ...patch };
  return body;
}

function withoutCurrentField(field: string): Body {
  const body = clone(success);
  delete (body.current as Body)[field];
  return body;
}

function setup(response: () => Promise<Response> | Response = () => jsonResponse(success)) {
  const fetchFn = vi.fn<typeof fetch>(() => Promise.resolve(response()));
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } satisfies Logger;
  const provider = new WeatherstackProvider({
    apiKey: API_KEY,
    baseUrl: 'https://api.weatherstack.com',
    timeoutMs: 5000,
    fetch: fetchFn,
    logger,
  });
  return { provider, fetchFn, logger };
}

function requestedUrl(fetchFn: ReturnType<typeof setup>['fetchFn']): URL {
  const input = fetchFn.mock.calls[0]?.[0];
  return new URL(input instanceof Request ? input.url : String(input));
}

describe('WeatherstackProvider request', () => {
  it('AC-5.2: makes exactly one GET to /current with access_key, query=<zip> and units=f', async () => {
    const { provider, fetchFn } = setup();

    await provider.getCurrentByZip('85268');

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const url = requestedUrl(fetchFn);
    expect(url.origin + url.pathname).toBe('https://api.weatherstack.com/current');
    expect(url.searchParams.get('access_key')).toBe(API_KEY);
    expect(url.searchParams.get('query')).toBe('85268');
    expect(url.searchParams.get('units')).toBe('f');
  });

  it('respects a base URL override (e.g. http for plans without HTTPS)', async () => {
    const fetchFn = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse(success)));
    const provider = new WeatherstackProvider({
      apiKey: API_KEY,
      baseUrl: 'http://weather.test/v1/',
      fetch: fetchFn,
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });

    await provider.getCurrentByZip('02134');

    const url = requestedUrl(fetchFn);
    expect(url.origin + url.pathname).toBe('http://weather.test/v1/current');
    expect(url.searchParams.get('query')).toBe('02134');
  });

  it('passes an abort signal to fetch', async () => {
    const { provider, fetchFn } = setup();

    await provider.getCurrentByZip('85268');

    expect(fetchFn.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });
});

describe('WeatherstackProvider success mapping', () => {
  it('AC-5.1: parses lat/lon strings to numbers and returns the current object', async () => {
    const { provider } = setup();

    const lookup = await provider.getCurrentByZip('85268');

    expect(lookup.lat).toBe(33.609);
    expect(lookup.long).toBe(-111.724);
    expect(lookup.current).toEqual(success.current);
  });

  it('AC-5.1: keeps fields that are not modelled (astro, air_quality)', async () => {
    const { provider } = setup();

    const { current } = await provider.getCurrentByZip('85268');

    expect(current).toHaveProperty('astro', success.current.astro);
    expect(current).toHaveProperty('air_quality', success.current.air_quality);
  });

  it.each(['USA', 'United States', 'United States of America'])(
    'AC-5.9: accepts country "%s" as the US',
    async (country) => {
      const { provider } = setup(() => jsonResponse(withLocation({ country })));

      await expect(provider.getCurrentByZip('85268')).resolves.toMatchObject({ lat: 33.609 });
    },
  );

  it('AC-5.14: succeeds when current has only the 4 required fields', async () => {
    const { provider } = setup(() => jsonResponse(successMinimal));

    const { current } = await provider.getCurrentByZip('85268');

    expect(current).toEqual(successMinimal.current);
  });

  it('AC-5.14: drops optional fields with a wrong type instead of failing', async () => {
    const { provider } = setup(() => jsonResponse(malformed));

    const { current } = await provider.getCurrentByZip('85268');

    expect(current.temperature).toBe(88);
    expect(current.weather_code).toBe(113);
    expect(current.humidity).toBe(33);
    // wind_speed: "3" (string), uv_index: null, is_day: "maybe" are all invalid.
    expect(current).not.toHaveProperty('wind_speed');
    expect(current).not.toHaveProperty('uv_index');
    expect(current).not.toHaveProperty('is_day');
  });

  it.each([
    'feelslike',
    'weather_code',
    'wind_speed',
    'wind_degree',
    'wind_dir',
    'pressure',
    'precip',
    'humidity',
    'cloudcover',
    'uv_index',
    'visibility',
    'is_day',
  ])('AC-5.14: succeeds when optional field %s is missing', async (field) => {
    const { provider } = setup(() => jsonResponse(withoutCurrentField(field)));

    const { current } = await provider.getCurrentByZip('85268');

    expect(current).not.toHaveProperty(field);
  });
});

describe('WeatherstackProvider errors', () => {
  it('AC-5.8: success:false with code 615 → LocationNotFoundError', async () => {
    const { provider } = setup(() => jsonResponse(error615));

    const error = await provider.getCurrentByZip('85268').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(LocationNotFoundError);
    expect(error).toMatchObject({ zipCode: '85268' });
  });

  it('AC-5.9: a location outside the US → LocationNotFoundError', async () => {
    const { provider } = setup(() => jsonResponse(nonUs));

    await expect(provider.getCurrentByZip('85268')).rejects.toBeInstanceOf(LocationNotFoundError);
  });

  it.each([
    ['101 invalid key', error101, 101, 'invalid_access_key'],
    ['105 https restricted', error105, 105, 'https_access_restricted'],
    [
      '104 quota',
      { success: false, error: { code: 104, type: 'usage_limit_reached' } },
      104,
      'usage_limit_reached',
    ],
  ])(
    'AC-5.10: success:false %s → WeatherUnavailableError, provider code logged',
    async (_label, body, code, type) => {
      const { provider, logger } = setup(() => jsonResponse(body));

      const error = await provider.getCurrentByZip('85268').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(WeatherUnavailableError);
      expect(error).toMatchObject({ providerCode: code });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ zipCode: '85268', errorCode: code, errorType: type }),
      );
    },
  );

  it.each([500, 503, 401])('AC-5.10: HTTP %i → WeatherUnavailableError', async (status) => {
    const { provider } = setup(() => jsonResponse(success, status));

    await expect(provider.getCurrentByZip('85268')).rejects.toBeInstanceOf(WeatherUnavailableError);
  });

  it('AC-5.10: a non-JSON body → WeatherUnavailableError', async () => {
    const { provider } = setup(() => new Response('<html>Bad gateway</html>', { status: 200 }));

    await expect(provider.getCurrentByZip('85268')).rejects.toBeInstanceOf(WeatherUnavailableError);
  });

  it('AC-5.10: a network error → WeatherUnavailableError', async () => {
    const { provider } = setup(() => Promise.reject(new TypeError('fetch failed')));

    await expect(provider.getCurrentByZip('85268')).rejects.toBeInstanceOf(WeatherUnavailableError);
  });

  it.each<[string, () => Body]>([
    [
      'missing location',
      () => {
        const body = clone(success);
        delete body.location;
        return body;
      },
    ],
    ['non-numeric lat', () => withLocation({ lat: 'abc' })],
    ['empty lon', () => withLocation({ lon: '' })],
    ['lat out of range', () => withLocation({ lat: '91' })],
    ['lon out of range', () => withLocation({ lon: '-180.5' })],
    ['numeric lat instead of string', () => withLocation({ lat: 33.609 })],
    [
      'missing country',
      () => {
        const body = clone(success);
        delete (body.location as Body).country;
        return body;
      },
    ],
  ])('AC-5.10: unusable location (%s) → WeatherUnavailableError', async (_label, makeBody) => {
    const { provider } = setup(() => jsonResponse(makeBody()));

    await expect(provider.getCurrentByZip('85268')).rejects.toBeInstanceOf(WeatherUnavailableError);
  });

  it('AC-5.10: missing required current.temperature → WeatherUnavailableError', async () => {
    const { provider } = setup(() => jsonResponse(missingRequired));

    await expect(provider.getCurrentByZip('85268')).rejects.toBeInstanceOf(WeatherUnavailableError);
  });

  it.each<[string, Body]>([
    ['observation_time missing', { observation_time: undefined }],
    ['observation_time not a string', { observation_time: 854 }],
    ['temperature not a number', { temperature: '88' }],
    ['weather_descriptions not an array', { weather_descriptions: 'Clear' }],
    ['weather_descriptions with a non-string', { weather_descriptions: [1] }],
    ['weather_icons missing', { weather_icons: undefined }],
    ['weather_icons not an array', { weather_icons: 'https://x/icon.png' }],
  ])(
    'AC-5.10: required current field invalid (%s) → WeatherUnavailableError',
    async (_label, patch) => {
      const { provider } = setup(() => jsonResponse(withCurrent(patch)));

      await expect(provider.getCurrentByZip('85268')).rejects.toBeInstanceOf(
        WeatherUnavailableError,
      );
    },
  );

  it('AC-5.10: a body without current → WeatherUnavailableError', async () => {
    const body = clone(success);
    delete body.current;
    const { provider } = setup(() => jsonResponse(body));

    await expect(provider.getCurrentByZip('85268')).rejects.toBeInstanceOf(WeatherUnavailableError);
  });
});

describe('WeatherstackProvider timeout', () => {
  it('AC-5.11: gives up after timeoutMs with WeatherUnavailableError and does not retry', async () => {
    const fetchFn = vi.fn<typeof fetch>(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason as Error));
        }),
    );
    const provider = new WeatherstackProvider({
      apiKey: API_KEY,
      timeoutMs: 20,
      fetch: fetchFn,
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });

    const started = Date.now();
    const error = await provider.getCurrentByZip('85268').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(WeatherUnavailableError);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe('WeatherstackProvider secrecy', () => {
  const failures: [string, () => Promise<Response> | Response][] = [
    ['error 101', () => jsonResponse(error101)],
    ['error 615', () => jsonResponse(error615)],
    ['HTTP 500', () => jsonResponse({}, 500)],
    ['non-JSON', () => new Response('nope')],
    ['network', () => Promise.reject(new TypeError('fetch failed'))],
    ['non-US', () => jsonResponse(nonUs)],
    ['missing required', () => jsonResponse(missingRequired)],
  ];

  it.each(failures)(
    'AC-5.13: the API key never appears in errors or logs (%s)',
    async (_label, respond) => {
      const { provider, logger } = setup(respond);

      const error = await provider.getCurrentByZip('85268').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(Error);
      expect(String((error as Error).message)).not.toContain(API_KEY);
      expect(JSON.stringify(error)).not.toContain(API_KEY);
      const logged = JSON.stringify([
        logger.info.mock.calls,
        logger.warn.mock.calls,
        logger.error.mock.calls,
      ]);
      expect(logged).not.toContain(API_KEY);
    },
  );

  it('AC-5.13: the API key never appears in success logs', async () => {
    const { provider, logger } = setup();

    await provider.getCurrentByZip('85268');

    const logged = JSON.stringify([
      logger.info.mock.calls,
      logger.warn.mock.calls,
      logger.error.mock.calls,
    ]);
    expect(logged).not.toContain(API_KEY);
  });
});
