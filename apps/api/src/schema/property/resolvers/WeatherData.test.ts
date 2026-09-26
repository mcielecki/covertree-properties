import type { GraphQLResolveInfo } from 'graphql';
import { describe, expect, it } from 'vitest';
import type { GraphQLContext } from '../../../context.js';
import type { WeatherCurrent } from '../../../weather/weather-provider.js';
import type { WeatherDataResolvers } from '../../types.generated.js';
import { WeatherData } from './WeatherData.js';

type Field = Exclude<keyof WeatherDataResolvers, '__isTypeOf'>;

/** Resolves one field the way graphql-js does: explicit resolver, else the parent's property. */
async function resolve(field: Field, parent: WeatherCurrent): Promise<unknown> {
  const resolver = WeatherData[field];
  if (resolver === undefined) {
    return (parent as Record<string, unknown>)[field];
  }
  if (typeof resolver !== 'function') {
    throw new Error(`${field}: expected a resolver function`);
  }
  return resolver(parent, {}, {} as GraphQLContext, {} as GraphQLResolveInfo);
}

async function resolveAll(parent: WeatherCurrent): Promise<Record<Field, unknown>> {
  const fields: Field[] = [
    'observationTime',
    'temperature',
    'weatherDescriptions',
    'weatherIcons',
    'feelsLike',
    'weatherCode',
    'windSpeed',
    'windDegree',
    'windDir',
    'pressure',
    'precip',
    'humidity',
    'cloudCover',
    'uvIndex',
    'visibility',
    'isDay',
  ];
  const entries = await Promise.all(
    fields.map(async (field) => [field, await resolve(field, parent)] as const),
  );
  return Object.fromEntries(entries) as Record<Field, unknown>;
}

const REQUIRED = {
  observation_time: '12:14 PM',
  temperature: 95,
  weather_descriptions: ['Sunny'],
  weather_icons: ['https://example.com/sunny.png'],
};

describe('WeatherData resolvers', () => {
  it('maps every snake_case field of the stored object to its camelCase field', async () => {
    const current: WeatherCurrent = {
      ...REQUIRED,
      feelslike: 93,
      weather_code: 113,
      wind_speed: 8,
      wind_degree: 250,
      wind_dir: 'WSW',
      pressure: 1010,
      precip: 0,
      humidity: 12,
      cloudcover: 0,
      uv_index: 9,
      visibility: 10,
      is_day: 'yes',
    };

    expect(await resolveAll(current)).toEqual({
      observationTime: '12:14 PM',
      temperature: 95,
      weatherDescriptions: ['Sunny'],
      weatherIcons: ['https://example.com/sunny.png'],
      feelsLike: 93,
      weatherCode: 113,
      windSpeed: 8,
      windDegree: 250,
      windDir: 'WSW',
      pressure: 1010,
      precip: 0,
      humidity: 12,
      cloudCover: 0,
      uvIndex: 9,
      visibility: 10,
      isDay: true,
    });
  });

  it('AC-5.14: resolves every absent optional field to null', async () => {
    const resolved = await resolveAll(REQUIRED);

    expect(resolved).toEqual({
      observationTime: '12:14 PM',
      temperature: 95,
      weatherDescriptions: ['Sunny'],
      weatherIcons: ['https://example.com/sunny.png'],
      feelsLike: null,
      weatherCode: null,
      windSpeed: null,
      windDegree: null,
      windDir: null,
      pressure: null,
      precip: null,
      humidity: null,
      cloudCover: null,
      uvIndex: null,
      visibility: null,
      isDay: null,
    });
  });

  it.each([
    ['yes', true],
    ['no', false],
    [undefined, null],
  ] as const)('maps is_day %s to isDay %s', async (isDay, expected) => {
    expect(await resolve('isDay', { ...REQUIRED, is_day: isDay })).toBe(expected);
  });

  it('keeps 0 values instead of turning them into null', async () => {
    const current = { ...REQUIRED, precip: 0, cloudcover: 0, uv_index: 0, wind_speed: 0 };

    const resolved = await resolveAll(current);

    expect(resolved).toMatchObject({ precip: 0, cloudCover: 0, uvIndex: 0, windSpeed: 0 });
  });
});
