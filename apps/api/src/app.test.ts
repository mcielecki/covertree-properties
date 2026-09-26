import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import type { Logger } from './logger.js';
import { InMemoryPropertyRepository } from './property/in-memory-property.repository.js';
import { PropertyService } from './property/property.service.js';
import { FakeWeatherProvider } from './weather/fake-weather.provider.js';

const CORS_ORIGIN = 'http://localhost:5173';

function setup(repository = new InMemoryPropertyRepository()) {
  const logError = vi.fn<Logger['error']>();
  const logger: Logger = { info: vi.fn(), warn: vi.fn(), error: logError };
  const app = createApp({
    propertyService: new PropertyService(repository, new FakeWeatherProvider()),
    logger,
    corsOrigin: CORS_ORIGIN,
  });
  const post = (query: string) =>
    app.fetch('http://localhost/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query }),
    });
  return { app, logError, post };
}

describe('createApp', () => {
  it('serves the property schema', async () => {
    const { post } = setup();

    const response = await post('query { properties { totalCount } }');

    expect(await response.json()).toEqual({ data: { properties: { totalCount: 0 } } });
  });

  it('masks unexpected errors and logs them with the operation name', async () => {
    const repository = new InMemoryPropertyRepository();
    const failure = new Error('connection refused');
    vi.spyOn(repository, 'list').mockRejectedValue(failure);
    const { logError, post } = setup(repository);

    const response = await post('query ListProperties { properties { totalCount } }');

    const body = (await response.json()) as { errors: { message: string; extensions: unknown }[] };
    expect(body.errors[0]?.message).toBe('Unexpected error.');
    expect(JSON.stringify(body)).not.toContain('connection refused');
    expect(logError).toHaveBeenCalledWith(
      'Unexpected error',
      expect.objectContaining({ operationName: 'ListProperties', error: failure }),
    );
  });

  it('does not log domain errors as unexpected', async () => {
    const { logError, post } = setup();

    const response = await post('query { property(id: "not-a-uuid") { id } }');

    const body = (await response.json()) as { errors: { extensions: { code: string } }[] };
    expect(body.errors[0]?.extensions.code).toBe('BAD_USER_INPUT');
    expect(logError).not.toHaveBeenCalled();
  });

  it('does not log request errors such as an invalid variable value', async () => {
    const { app, logError } = setup();

    const response = await app.fetch('http://localhost/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: 'query Q($filter: PropertyFilter) { properties(filter: $filter) { totalCount } }',
        variables: { filter: { state: 'XX' } },
      }),
    });

    expect(response.status).toBe(400);
    expect(logError).not.toHaveBeenCalled();
  });

  // docker-compose.yml probes this endpoint as the api healthcheck.
  it('answers the liveness check on /health', async () => {
    const { app } = setup();

    const response = await app.fetch('http://localhost/health');

    expect(response.status).toBe(200);
  });

  it('allows the configured CORS origin', async () => {
    const { app } = setup();

    const response = await app.fetch('http://localhost/graphql', {
      method: 'OPTIONS',
      headers: {
        origin: CORS_ORIGIN,
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
    });

    expect(response.headers.get('access-control-allow-origin')).toBe(CORS_ORIGIN);
  });

  it('does not allow other origins', async () => {
    const { app } = setup();

    const response = await app.fetch('http://localhost/graphql', {
      method: 'OPTIONS',
      headers: { origin: 'https://evil.example', 'access-control-request-method': 'POST' },
    });

    expect(response.headers.get('access-control-allow-origin')).not.toBe('https://evil.example');
  });
});
