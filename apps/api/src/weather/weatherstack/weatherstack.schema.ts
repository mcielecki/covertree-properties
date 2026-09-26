import { z } from 'zod';
import type { WeatherCurrent } from '../weather-provider.js';

// Weatherstack response shapes (SPEC §4.3). Errors arrive as HTTP 200 with `success: false`.

export const weatherstackErrorBodySchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number(),
    type: z.string(),
    info: z.string().optional(),
  }),
});

export const US_COUNTRY_NAMES: readonly string[] = [
  'United States of America',
  'USA',
  'United States',
];

/** Weatherstack sends coordinates as strings, e.g. "33.609". */
function coordinate(min: number, max: number) {
  return z.string().trim().min(1).transform(Number).pipe(z.number().min(min).max(max));
}

export const weatherstackLocationSchema = z.object({
  country: z.string(),
  lat: coordinate(-90, 90),
  lon: coordinate(-180, 180),
});

/** Missing or mistyped optional fields become undefined instead of failing the parse (AC-5.14). */
function optional<T extends z.ZodType>(schema: T) {
  return schema.optional().catch(undefined);
}

/**
 * The `current` object, units=f. Only the first four fields are required.
 * Loose: fields we don't model (astro, air_quality, ...) are kept for storage.
 * `satisfies` checks at compile time that the parsed output fits the domain type.
 */
export const weatherCurrentSchema = z.looseObject({
  observation_time: z.string(),
  temperature: z.number(),
  weather_descriptions: z.array(z.string()),
  weather_icons: z.array(z.string()),
  feelslike: optional(z.number()),
  weather_code: optional(z.number().int()),
  wind_speed: optional(z.number()),
  wind_degree: optional(z.number().int()),
  wind_dir: optional(z.string()),
  pressure: optional(z.number()),
  precip: optional(z.number()),
  humidity: optional(z.number().int()),
  cloudcover: optional(z.number().int()),
  uv_index: optional(z.number()),
  visibility: optional(z.number()),
  is_day: optional(z.enum(['yes', 'no'])),
}) satisfies z.ZodType<WeatherCurrent>;

export const weatherstackSuccessBodySchema = z.object({
  location: weatherstackLocationSchema,
  current: weatherCurrentSchema,
});
