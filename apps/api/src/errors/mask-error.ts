import { GraphQLError } from 'graphql';
import { maskError as yogaMaskError } from 'graphql-yoga';
import {
  AlreadyExistsError,
  LocationNotFoundError,
  NotFoundError,
  ValidationError,
  WeatherUnavailableError,
} from './domain-errors.js';

/**
 * Yoga's `maskedErrors.maskError` (SPEC §5): turns domain errors into client-facing GraphQLErrors
 * with `extensions.code`. Everything else goes through Yoga's default masking.
 * Messages are fixed here, so internal reasons and provider codes never reach the client.
 */
export function maskError(error: unknown, message: string, isDev?: boolean): Error {
  const original = error instanceof GraphQLError ? error.originalError : error;
  const domain = toClientError(original);
  if (domain === undefined) {
    return yogaMaskError(error, message, isDev);
  }
  const graphQLError = error instanceof GraphQLError ? error : undefined;
  return new GraphQLError(domain.message, {
    nodes: graphQLError?.nodes,
    source: graphQLError?.source,
    positions: graphQLError?.positions,
    path: graphQLError?.path,
    extensions: domain.extensions,
  });
}

/** True for the errors this module maps to a client-facing code. Anything else is unexpected. */
export function isDomainError(error: unknown): boolean {
  return toClientError(error) !== undefined;
}

function toClientError(
  error: unknown,
): { message: string; extensions: Record<string, unknown> } | undefined {
  if (error instanceof ValidationError) {
    return {
      message: 'Invalid input',
      extensions: { code: 'BAD_USER_INPUT', fieldErrors: error.fieldErrors },
    };
  }
  if (error instanceof NotFoundError) {
    return { message: 'Property not found', extensions: { code: 'NOT_FOUND', id: error.id } };
  }
  if (error instanceof AlreadyExistsError) {
    return {
      message: 'A property with this address already exists',
      extensions: {
        code: 'ALREADY_EXISTS',
        ...(error.id === undefined ? {} : { id: error.id }),
      },
    };
  }
  if (error instanceof LocationNotFoundError) {
    return {
      message: `Could not resolve a US location for zip code ${error.zipCode}`,
      extensions: { code: 'LOCATION_NOT_FOUND', zipCode: error.zipCode },
    };
  }
  if (error instanceof WeatherUnavailableError) {
    return {
      message: 'Weather service is unavailable, please try again later',
      extensions: { code: 'WEATHER_SERVICE_UNAVAILABLE' },
    };
  }
  return undefined;
}
