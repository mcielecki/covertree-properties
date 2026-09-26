import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { LocationNotFoundError, WeatherUnavailableError } from '../../src/errors/domain-errors.js';
import { FakeWeatherProvider } from '../../src/weather/fake-weather.provider.js';
import { truncateAll } from '../helpers/db.js';
import { createIntegrationHarness, createTestApp, errorCodes, gql } from '../helpers/graphql.js';

const CREATE = /* GraphQL */ `
  mutation Create($input: CreatePropertyInput!) {
    createProperty(input: $input) {
      id
      street
      city
      state
      zipCode
      lat
      long
      createdAt
      weatherData {
        observationTime
        temperature
        weatherDescriptions
        weatherIcons
        feelsLike
        uvIndex
        windDegree
        isDay
      }
    }
  }
`;

const DELETE = /* GraphQL */ `
  mutation Delete($id: ID!) {
    deleteProperty(id: $id)
  }
`;

const VALID_INPUT = {
  street: '15528 E Golden Eagle Blvd',
  city: 'Fountain Hills',
  state: 'AZ',
  zipCode: '85268',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface CreateData {
  createProperty: {
    id: string;
    street: string;
    city: string;
    createdAt: string;
    weatherData: Record<string, unknown>;
    [field: string]: unknown;
  };
}

const { prisma, weather, app } = createIntegrationHarness();

const create = (input: Record<string, unknown> = VALID_INPUT) =>
  gql<CreateData>(app, CREATE, { input });

const storedCount = () => prisma.property.count();

beforeEach(async () => {
  await truncateAll(prisma);
  weather.reset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('US-5 add a property', () => {
  it('AC-5.1: persists and returns the property with weather and coordinates', async () => {
    const before = Date.now();

    const { body } = await create();

    expect(body.errors).toBeUndefined();
    const property = body.data?.createProperty;
    expect(property).toMatchObject({
      street: '15528 E Golden Eagle Blvd',
      city: 'Fountain Hills',
      state: 'AZ',
      zipCode: '85268',
      lat: 33.609,
      long: -111.724,
      weatherData: {
        observationTime: '08:54 AM',
        temperature: 88,
        weatherDescriptions: ['Sunny'],
        feelsLike: 88,
        isDay: true,
      },
    });
    expect(property?.id).toMatch(UUID);
    const createdAt = Date.parse(property?.createdAt ?? '');
    expect(createdAt).toBeGreaterThanOrEqual(before - 1000);
    expect(createdAt).toBeLessThanOrEqual(Date.now() + 1000);

    const row = await prisma.property.findUniqueOrThrow({ where: { id: property?.id } });
    // The raw `current` object is stored as is (snake_case), not the GraphQL shape.
    expect(row.weatherData).toEqual(
      (await new FakeWeatherProvider().getCurrentByZip('85268')).current,
    );
  });

  it('AC-5.2: calls the weather provider exactly once, with the zip code', async () => {
    await create();

    expect(weather.calls).toEqual(['85268']);
  });

  it.each(['8526', '852680', '8526a', '85268-1234'])(
    'AC-5.3: rejects zip code %s without calling Weatherstack',
    async (zipCode) => {
      const response = await create({ ...VALID_INPUT, zipCode });

      expect(response.body.data).toBeNull();
      expect(errorCodes(response)).toEqual(['BAD_USER_INPUT']);
      expect(response.body.errors?.[0]?.extensions?.fieldErrors).toEqual({
        zipCode: ['Zip code must be exactly 5 digits'],
      });
      expect(weather.calls).toEqual([]);
      expect(await storedCount()).toBe(0);
    },
  );

  it.each([
    ['street', ''],
    ['street', '   '],
    ['street', 'x'.repeat(201)],
    ['city', ''],
    ['city', ' \t '],
    ['city', 'x'.repeat(101)],
  ])('AC-5.4: rejects %s %j without calling Weatherstack', async (field, value) => {
    const response = await create({ ...VALID_INPUT, [field]: value });

    expect(errorCodes(response)).toEqual(['BAD_USER_INPUT']);
    expect(response.body.errors?.[0]?.extensions?.fieldErrors).toHaveProperty(field);
    expect(weather.calls).toEqual([]);
    expect(await storedCount()).toBe(0);
  });

  it('AC-5.4: accepts street and city at their maximum length', async () => {
    const { body } = await create({
      ...VALID_INPUT,
      street: 'x'.repeat(200),
      city: 'y'.repeat(100),
    });

    expect(body.errors).toBeUndefined();
  });

  it('AC-5.5: rejects an unknown state literal with GRAPHQL_VALIDATION_FAILED', async () => {
    const response = await gql(
      app,
      `mutation {
        createProperty(input: { street: "1 Main St", city: "Phoenix", state: XX, zipCode: "85001" }) { id }
      }`,
    );

    expect(response.status).toBe(400);
    expect(errorCodes(response)).toEqual(['GRAPHQL_VALIDATION_FAILED']);
    expect(weather.calls).toEqual([]);
  });

  it('AC-5.5: rejects an unknown state variable with HTTP 400 (SPEC §5)', async () => {
    const response = await create({ ...VALID_INPUT, state: 'XX' });

    expect(response.status).toBe(400);
    expect(response.body.data).toBeUndefined();
    expect(weather.calls).toEqual([]);
    expect(await storedCount()).toBe(0);
  });

  it('AC-5.6: stores normalized street and city', async () => {
    const { body } = await create({
      ...VALID_INPUT,
      street: '  15528  E Golden Eagle Blvd ',
      city: ' Fountain  Hills',
    });

    expect(body.data?.createProperty).toMatchObject({
      street: '15528 E Golden Eagle Blvd',
      city: 'Fountain Hills',
    });
    const row = await prisma.property.findFirstOrThrow();
    expect(row).toMatchObject({ street: '15528 E Golden Eagle Blvd', city: 'Fountain Hills' });
  });

  it('AC-5.7: rejects a duplicate address (case-insensitive) before calling Weatherstack', async () => {
    const first = await create();
    weather.reset();

    const response = await create({
      ...VALID_INPUT,
      street: '15528 e GOLDEN eagle blvd',
      city: 'fountain hills',
    });

    expect(response.body.data).toBeNull();
    expect(response.body.errors?.[0]).toMatchObject({
      message: 'A property with this address already exists',
      extensions: { code: 'ALREADY_EXISTS', id: first.body.data?.createProperty.id },
    });
    expect(weather.calls).toEqual([]);
    expect(await storedCount()).toBe(1);
  });

  it.each([
    ['AC-5.8', 'code 615', new LocationNotFoundError('85268', 'provider error 615')],
    ['AC-5.9', 'a non-US location', new LocationNotFoundError('85268', 'resolved outside the US')],
  ])('%s: maps %s to LOCATION_NOT_FOUND and persists nothing', async (_ac, _case, error) => {
    weather.failWith(error);

    const response = await create();

    expect(response.body.data).toBeNull();
    expect(response.body.errors?.[0]).toMatchObject({
      message: 'Could not resolve a US location for zip code 85268',
      extensions: { code: 'LOCATION_NOT_FOUND', zipCode: '85268' },
    });
    expect(await storedCount()).toBe(0);
  });

  it.each([
    [
      'AC-5.10',
      new WeatherUnavailableError('provider error 104 usage_limit_reached', { providerCode: 104 }),
    ],
    ['AC-5.10', new WeatherUnavailableError('required field temperature missing')],
    ['AC-5.11', new WeatherUnavailableError('timed out after 5000 ms')],
  ])('%s: maps %s to WEATHER_SERVICE_UNAVAILABLE and persists nothing', async (_ac, error) => {
    weather.failWith(error);

    const response = await create();

    expect(response.body.data).toBeNull();
    expect(response.body.errors).toEqual([
      expect.objectContaining({
        message: 'Weather service is unavailable, please try again later',
        extensions: { code: 'WEATHER_SERVICE_UNAVAILABLE' },
      }),
    ]);
    expect(JSON.stringify(response.body)).not.toMatch(/104|usage_limit|timed out|temperature/);
    expect(await storedCount()).toBe(0);
  });

  it('AC-5.12: of two concurrent identical creates, exactly one succeeds', async () => {
    // Both pass the pre-check while the fake "calls Weatherstack"; the unique constraint decides.
    const slowWeather = new FakeWeatherProvider({ delayMs: 50 });
    const { app: slowApp } = createTestApp(prisma, slowWeather);
    const send = () => gql<CreateData>(slowApp, CREATE, { input: VALID_INPUT });

    const responses = await Promise.all([send(), send()]);

    expect(slowWeather.calls).toHaveLength(2);
    const codes = responses.map((response) => errorCodes(response)[0] ?? 'OK').sort();
    expect(codes).toEqual(['ALREADY_EXISTS', 'OK']);
    const failed = responses.find((response) => response.body.errors);
    // After a race the existing id is not known, so it is omitted (SPEC §4.5).
    expect(failed?.body.errors?.[0]?.extensions).toEqual({ code: 'ALREADY_EXISTS' });
    expect(await storedCount()).toBe(1);
  });

  it('AC-5.13: never exposes the API key in an error response', async () => {
    const apiKey = 'test-secret-key-0123456789';
    weather.failWith(
      new WeatherUnavailableError(`network error for key ${apiKey}`, {
        cause: new Error(`GET /current?access_key=${apiKey}`),
      }),
    );

    const response = await create();

    expect(JSON.stringify(response.body)).not.toContain(apiKey);
  });

  it('AC-5.14: creates the property when optional weather fields are missing', async () => {
    const minimal = new FakeWeatherProvider({
      lookup: {
        lat: 33.609,
        long: -111.724,
        current: {
          observation_time: '12:14 PM',
          temperature: 95,
          weather_descriptions: ['Sunny'],
          weather_icons: ['https://example.com/sunny.png'],
        },
      },
    });
    const { app: minimalApp } = createTestApp(prisma, minimal);

    const { body } = await gql<CreateData>(minimalApp, CREATE, { input: VALID_INPUT });

    expect(body.errors).toBeUndefined();
    expect(body.data?.createProperty.weatherData).toEqual({
      observationTime: '12:14 PM',
      temperature: 95,
      weatherDescriptions: ['Sunny'],
      weatherIcons: ['https://example.com/sunny.png'],
      feelsLike: null,
      uvIndex: null,
      windDegree: null,
      isDay: null,
    });
  });
});

describe('US-6 hard delete', () => {
  it('AC-6.4: the same address can be created again after a delete', async () => {
    const first = await create();
    await gql(app, DELETE, { id: first.body.data?.createProperty.id });

    const second = await create();

    expect(second.body.errors).toBeUndefined();
    expect(second.body.data?.createProperty.id).not.toBe(first.body.data?.createProperty.id);
  });
});
