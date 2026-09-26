import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { truncateAll } from '../helpers/db.js';
import { createIntegrationHarness, errorCodes, gql } from '../helpers/graphql.js';

const ALL_FIELDS = /* GraphQL */ `
  fragment AllFields on Property {
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
      weatherCode
      windSpeed
      windDegree
      windDir
      pressure
      precip
      humidity
      cloudCover
      uvIndex
      visibility
      isDay
    }
  }
`;

const PROPERTY = /* GraphQL */ `
  ${ALL_FIELDS}
  query Property($id: ID!) {
    property(id: $id) {
      ...AllFields
    }
  }
`;

const CREATE = /* GraphQL */ `
  ${ALL_FIELDS}
  mutation Create($input: CreatePropertyInput!) {
    createProperty(input: $input) {
      ...AllFields
    }
  }
`;

const VALID_INPUT = {
  street: '15528 E Golden Eagle Blvd',
  city: 'Fountain Hills',
  state: 'AZ',
  zipCode: '85268',
};

interface PropertyData {
  property: Record<string, unknown> | null;
}

const { prisma, weather, app } = createIntegrationHarness();

async function create(): Promise<Record<string, unknown> & { id: string }> {
  const { body } = await gql<{ createProperty: Record<string, unknown> & { id: string } }>(
    app,
    CREATE,
    { input: VALID_INPUT },
  );
  if (!body.data) throw new Error(`create failed: ${JSON.stringify(body.errors)}`);
  return body.data.createProperty;
}

beforeEach(async () => {
  await truncateAll(prisma);
  weather.reset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('US-4 property details', () => {
  it('AC-4.1: returns every field of an existing property', async () => {
    const created = await create();

    const { body } = await gql<PropertyData>(app, PROPERTY, { id: created.id });

    expect(body.errors).toBeUndefined();
    expect(body.data?.property).toEqual({
      id: created.id,
      street: '15528 E Golden Eagle Blvd',
      city: 'Fountain Hills',
      state: 'AZ',
      zipCode: '85268',
      lat: 33.609,
      long: -111.724,
      createdAt: created.createdAt,
      weatherData: {
        observationTime: '08:54 AM',
        temperature: 88,
        weatherDescriptions: ['Sunny'],
        weatherIcons: [
          'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0001_sunny.png',
        ],
        feelsLike: 88,
        weatherCode: 113,
        windSpeed: 3,
        windDegree: 45,
        windDir: 'NE',
        pressure: 1009,
        precip: 0,
        humidity: 33,
        cloudCover: 1,
        uvIndex: 7,
        visibility: 6,
        isDay: true,
      },
    });
    expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('AC-4.2: returns null without errors for an unknown id', async () => {
    const { body } = await gql<PropertyData>(app, PROPERTY, {
      id: '00000000-0000-4000-8000-000000000000',
    });

    expect(body).toEqual({ data: { property: null } });
  });

  it('AC-4.3: rejects an id that is not a UUID with BAD_USER_INPUT', async () => {
    const response = await gql<PropertyData>(app, PROPERTY, { id: 'not-a-uuid' });

    expect(errorCodes(response)).toEqual(['BAD_USER_INPUT']);
    expect(response.body.errors?.[0]?.extensions?.fieldErrors).toEqual({ id: ['Invalid id'] });
  });

  it('AC-4.4 / AC-4.5: never calls Weatherstack and returns the weather stored at creation', async () => {
    const created = await create();
    weather.reset();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const first = await gql<PropertyData>(app, PROPERTY, { id: created.id });
    const second = await gql<PropertyData>(app, PROPERTY, { id: created.id });

    expect(weather.calls).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(first.body.data?.property?.weatherData).toEqual(created.weatherData);
    expect(second.body.data?.property?.weatherData).toEqual(created.weatherData);
    fetchSpy.mockRestore();
  });
});
