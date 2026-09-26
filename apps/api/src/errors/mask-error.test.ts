import { GraphQLError } from 'graphql';
import { describe, expect, it } from 'vitest';
import {
  AlreadyExistsError,
  LocationNotFoundError,
  NotFoundError,
  ValidationError,
  WeatherUnavailableError,
} from './domain-errors.js';
import { maskError } from './mask-error.js';

/** Yoga passes resolver errors wrapped in a GraphQLError with the thrown error as originalError. */
function wrapped(error: Error): GraphQLError {
  return new GraphQLError(error.message, { originalError: error, path: ['field'] });
}

function mask(error: unknown, isDev = false): GraphQLError {
  const result = maskError(error, 'Unexpected error.', isDev);
  if (!(result instanceof GraphQLError)) {
    throw new Error('expected a GraphQLError');
  }
  return result;
}

describe('maskError', () => {
  it('maps ValidationError to BAD_USER_INPUT with fieldErrors', () => {
    const result = mask(
      wrapped(new ValidationError({ zipCode: ['Zip code must be exactly 5 digits'] })),
    );

    expect(result.message).toBe('Invalid input');
    expect(result.extensions).toEqual({
      code: 'BAD_USER_INPUT',
      fieldErrors: { zipCode: ['Zip code must be exactly 5 digits'] },
    });
  });

  it('maps NotFoundError to NOT_FOUND with the id', () => {
    const id = '7c0b6a55-8f0a-4a73-9d67-9f2a0a4b8e11';

    const result = mask(wrapped(new NotFoundError(id)));

    expect(result.message).toBe('Property not found');
    expect(result.extensions).toEqual({ code: 'NOT_FOUND', id });
  });

  it('maps AlreadyExistsError to ALREADY_EXISTS with the existing id when known', () => {
    const id = '7c0b6a55-8f0a-4a73-9d67-9f2a0a4b8e11';

    const result = mask(wrapped(new AlreadyExistsError(id)));

    expect(result.message).toBe('A property with this address already exists');
    expect(result.extensions).toEqual({ code: 'ALREADY_EXISTS', id });
  });

  it('omits the id from ALREADY_EXISTS when it is not known (unique-constraint race)', () => {
    const result = mask(wrapped(new AlreadyExistsError()));

    expect(result.extensions).toEqual({ code: 'ALREADY_EXISTS' });
  });

  it('AC-5.8/5.9: maps LocationNotFoundError to LOCATION_NOT_FOUND without the internal reason', () => {
    const result = mask(wrapped(new LocationNotFoundError('85268', 'resolved outside the US')));

    expect(result.message).toBe('Could not resolve a US location for zip code 85268');
    expect(result.extensions).toEqual({ code: 'LOCATION_NOT_FOUND', zipCode: '85268' });
  });

  it('AC-5.10/5.13: maps WeatherUnavailableError to a generic message with no provider details', () => {
    const error = new WeatherUnavailableError('provider error 101 invalid_access_key', {
      providerCode: 101,
      cause: new Error('secret-key-123'),
    });

    const result = mask(wrapped(error), true);

    expect(result.message).toBe('Weather service is unavailable, please try again later');
    expect(result.extensions).toEqual({ code: 'WEATHER_SERVICE_UNAVAILABLE' });
    expect(JSON.stringify(result.toJSON())).not.toMatch(/101|secret-key-123|invalid_access_key/);
  });

  it('keeps the original path so clients can tell which field failed', () => {
    const result = mask(wrapped(new NotFoundError('x')));

    expect(result.path).toEqual(['field']);
  });

  it('also maps a domain error that is not wrapped in a GraphQLError', () => {
    const result = mask(new NotFoundError('x'));

    expect(result.extensions.code).toBe('NOT_FOUND');
  });

  it('masks unknown errors as INTERNAL_SERVER_ERROR with the default message', () => {
    const result = mask(wrapped(new Error('connection refused to postgres://user:pw@db')));

    expect(result.message).toBe('Unexpected error.');
    expect(result.extensions.code).toBe('INTERNAL_SERVER_ERROR');
    expect(JSON.stringify(result.toJSON())).not.toContain('postgres://');
  });

  it('passes GraphQL errors that are not execution errors through unchanged', () => {
    const error = new GraphQLError('Variable "$id" of required type "ID!" was not provided.', {
      extensions: { code: 'BAD_USER_INPUT' },
    });

    expect(mask(error)).toBe(error);
  });
});
