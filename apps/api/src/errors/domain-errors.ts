// Domain errors know nothing about GraphQL; mask-error.ts maps them to extensions.code (SPEC §5).

/** Weatherstack could not resolve the zip code, or resolved it outside the US. → LOCATION_NOT_FOUND */
export class LocationNotFoundError extends Error {
  override readonly name = 'LocationNotFoundError';

  constructor(
    readonly zipCode: string,
    reason: string,
  ) {
    super(`Could not resolve a US location for zip code ${zipCode}: ${reason}`);
  }
}

/** Timeout, network, quota, auth, HTTPS restriction or a malformed response. → WEATHER_SERVICE_UNAVAILABLE */
export class WeatherUnavailableError extends Error {
  override readonly name = 'WeatherUnavailableError';
  /** Weatherstack `error.code` when the provider reported one. Logged, never sent to clients. */
  readonly providerCode: number | undefined;

  constructor(reason: string, options: { providerCode?: number; cause?: unknown } = {}) {
    super(`Weather service unavailable: ${reason}`, { cause: options.cause });
    this.providerCode = options.providerCode;
  }
}

/** zod validation failed for an argument. → BAD_USER_INPUT with `fieldErrors`. */
export class ValidationError extends Error {
  override readonly name = 'ValidationError';

  /** Field path (e.g. "zipCode", "limit") → human-readable messages. */
  constructor(readonly fieldErrors: Record<string, string[]>) {
    super('Invalid input');
  }
}

/** The normalized address is already stored. → ALREADY_EXISTS */
export class AlreadyExistsError extends Error {
  override readonly name = 'AlreadyExistsError';

  /** `id` of the existing property, when known (not after a unique-constraint race). */
  constructor(readonly id?: string) {
    super('A property with this address already exists');
  }
}

/** No property has this id. → NOT_FOUND */
export class NotFoundError extends Error {
  override readonly name = 'NotFoundError';

  constructor(readonly id: string) {
    super('Property not found');
  }
}
