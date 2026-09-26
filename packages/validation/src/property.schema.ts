import { z } from 'zod';
import { normalizeWhitespace } from './normalize.js';
import { US_STATES, type USState } from './us-states.js';

// Rules from SPEC §2.3. Length and format checks run on the normalized value.

export const streetSchema = z
  .string({ error: 'Street is required' })
  .overwrite(normalizeWhitespace)
  .min(1, { error: 'Street is required', abort: true })
  .max(200, { error: 'Street must be at most 200 characters' })
  .regex(/^\P{Cc}*$/u, { error: 'Street must not contain control characters' });

export const citySchema = z
  .string({ error: 'City is required' })
  .overwrite(normalizeWhitespace)
  .min(1, { error: 'City is required', abort: true })
  .max(100, { error: 'City must be at most 100 characters' })
  .regex(/^\p{L}[\p{L} .'-]*$/u, {
    error: "City must start with a letter and contain only letters, spaces, . ' and -",
  });

export const zipCodeSchema = z
  .string({ error: 'Zip code is required' })
  .regex(/^\d{5}$/, { error: 'Zip code must be exactly 5 digits' });

export const stateSchema = z.enum(US_STATES, { error: 'Select a valid US state' });

export const createPropertyInputSchema = z.object({
  street: streetSchema,
  city: citySchema,
  state: stateSchema,
  zipCode: zipCodeSchema,
});

export type CreatePropertyInput = z.input<typeof createPropertyInputSchema>;
export type NormalizedPropertyInput = z.output<typeof createPropertyInputSchema>;

export interface PropertyFilter {
  city?: string;
  zipCode?: string;
  state?: USState;
}

/** A missing or null filter, or a null field, means "no constraint" (AC-3.9). */
export const propertyFilterSchema = z
  .object({
    city: citySchema.nullish(),
    zipCode: zipCodeSchema.nullish(),
    state: stateSchema.nullish(),
  })
  .nullish()
  .transform((filter): PropertyFilter => {
    const result: PropertyFilter = {};
    if (filter?.city != null) result.city = filter.city;
    if (filter?.zipCode != null) result.zipCode = filter.zipCode;
    if (filter?.state != null) result.state = filter.state;
    return result;
  });

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/** Explicit null falls back to the default, like an omitted argument. */
export const paginationSchema = z.object({
  limit: z
    .int({ error: 'Limit must be an integer' })
    .min(1, { error: `Limit must be between 1 and ${MAX_LIMIT}` })
    .max(MAX_LIMIT, { error: `Limit must be between 1 and ${MAX_LIMIT}` })
    .nullish()
    .transform((value) => value ?? DEFAULT_LIMIT),
  offset: z
    .int({ error: 'Offset must be an integer' })
    .min(0, { error: 'Offset must be 0 or greater' })
    .nullish()
    .transform((value) => value ?? 0),
});

export type Pagination = z.output<typeof paginationSchema>;

export const idSchema = z.uuid({ error: 'Invalid id' });
