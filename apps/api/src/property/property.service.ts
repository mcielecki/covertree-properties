import {
  createPropertyInputSchema,
  idSchema,
  paginationSchema,
  propertyFilterSchema,
  type CreatePropertyInput,
} from '@covertree/validation';
import type { z } from 'zod';
import { AlreadyExistsError, ValidationError } from '../errors/domain-errors.js';
import type { WeatherProvider } from '../weather/weather-provider.js';
import { toAddressKey, toCityKey } from './keys.js';
import type { PropertyRepository } from './property.repository.js';
import type {
  PropertyPage,
  PropertyRecord,
  RepositoryFilter,
  SortOrder,
} from './property.types.js';

/** Arguments as they arrive from GraphQL: any of them may be omitted or null. */
export interface ListPropertiesArgs {
  filter?: z.input<typeof propertyFilterSchema>;
  sortOrder?: SortOrder | null;
  limit?: number | null;
  offset?: number | null;
}

type FieldErrors = Record<string, string[]>;

/**
 * Property use cases: validates and normalizes input, checks for duplicates, and is the only
 * caller of the weather provider (in `create`). Throws domain errors only.
 */
export class PropertyService {
  constructor(
    private readonly repository: PropertyRepository,
    private readonly weather: WeatherProvider,
  ) {}

  async list(args: ListPropertiesArgs = {}): Promise<PropertyPage> {
    const errors: FieldErrors = {};
    const filter = check(propertyFilterSchema, args.filter, errors);
    const page = check(paginationSchema, { limit: args.limit, offset: args.offset }, errors);
    if (!filter || !page) {
      throw new ValidationError(errors);
    }

    const repositoryFilter: RepositoryFilter = {};
    if (filter.city !== undefined) repositoryFilter.cityKey = toCityKey(filter.city);
    if (filter.zipCode !== undefined) repositoryFilter.zipCode = filter.zipCode;
    if (filter.state !== undefined) repositoryFilter.state = filter.state;

    return this.repository.list({
      filter: repositoryFilter,
      sortOrder: args.sortOrder ?? 'DESC',
      limit: page.limit,
      offset: page.offset,
    });
  }

  /** Returns null when no property has this id. */
  async getById(id: string): Promise<PropertyRecord | null> {
    return this.repository.findById(parseId(id));
  }

  async create(input: CreatePropertyInput): Promise<PropertyRecord> {
    const errors: FieldErrors = {};
    const normalized = check(createPropertyInputSchema, input, errors);
    if (!normalized) {
      throw new ValidationError(errors);
    }

    const addressKey = toAddressKey(normalized);
    // Saves a Weatherstack call for the common case. The unique constraint is the real guarantee.
    const existingId = await this.repository.findIdByAddressKey(addressKey);
    if (existingId !== null) {
      throw new AlreadyExistsError(existingId);
    }

    const { lat, long, current } = await this.weather.getCurrentByZip(normalized.zipCode);
    return this.repository.create({
      ...normalized,
      cityKey: toCityKey(normalized.city),
      addressKey,
      lat,
      long,
      weatherData: current,
    });
  }

  /** Returns the deleted id. Throws NotFoundError when no property has this id. */
  async delete(id: string): Promise<string> {
    const validId = parseId(id);
    await this.repository.delete(validId);
    return validId;
  }
}

function parseId(id: string): string {
  const errors: FieldErrors = {};
  const valid = check(idSchema, id, errors, 'id');
  if (valid === undefined) {
    throw new ValidationError(errors);
  }
  return valid;
}

/**
 * Parses `value`. On failure, adds the first message per field path to `errors` (the web form
 * shows one message per field) and returns undefined. `rootField` names errors on the value itself.
 */
function check<S extends z.ZodType>(
  schema: S,
  value: unknown,
  errors: FieldErrors,
  rootField = 'input',
): z.output<S> | undefined {
  const result = schema.safeParse(value);
  if (result.success) {
    return result.data;
  }
  for (const issue of result.error.issues) {
    const field = issue.path.length > 0 ? issue.path.join('.') : rootField;
    errors[field] ??= [issue.message];
  }
  return undefined;
}
