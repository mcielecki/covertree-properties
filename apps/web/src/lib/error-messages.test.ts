import { CombinedGraphQLErrors, ServerError } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { describeError } from './error-messages';

function graphQLError(code: string, extensions: Record<string, unknown> = {}) {
  return new CombinedGraphQLErrors({
    data: null,
    errors: [{ message: 'server message, never shown', extensions: { code, ...extensions } }],
  });
}

describe('describeError', () => {
  it('ALREADY_EXISTS carries the id of the existing property', () => {
    expect(describeError(graphQLError('ALREADY_EXISTS', { id: 'abc' }))).toEqual({
      code: 'ALREADY_EXISTS',
      message: 'A property with this address already exists.',
      existingId: 'abc',
    });
  });

  it('ALREADY_EXISTS without an id (unique-constraint race) has no link', () => {
    const described = describeError(graphQLError('ALREADY_EXISTS'));
    expect(described.message).toBe('A property with this address already exists.');
    expect(described.existingId).toBeUndefined();
  });

  it('LOCATION_NOT_FOUND names the zip code', () => {
    expect(describeError(graphQLError('LOCATION_NOT_FOUND', { zipCode: '99999' })).message).toBe(
      "We couldn't find a US location for zip code 99999. Check the zip code and try again.",
    );
  });

  it('WEATHER_SERVICE_UNAVAILABLE asks to retry later', () => {
    expect(describeError(graphQLError('WEATHER_SERVICE_UNAVAILABLE')).message).toBe(
      'The weather service is unavailable right now, so the property was not saved. Please try again later.',
    );
  });

  it('BAD_USER_INPUT exposes the first message per field', () => {
    const described = describeError(
      graphQLError('BAD_USER_INPUT', {
        fieldErrors: {
          zipCode: ['Zip code must be exactly 5 digits', 'second'],
          city: ['City is required'],
        },
      }),
    );
    expect(described).toEqual({
      code: 'BAD_USER_INPUT',
      message: 'Some fields are invalid. Check the highlighted fields.',
      fieldErrors: { zipCode: 'Zip code must be exactly 5 digits', city: 'City is required' },
    });
  });

  it('NOT_FOUND says the property no longer exists', () => {
    expect(describeError(graphQLError('NOT_FOUND', { id: 'abc' })).message).toBe(
      'This property no longer exists.',
    );
  });

  it('an unknown or masked code falls back to a generic message', () => {
    expect(describeError(graphQLError('INTERNAL_SERVER_ERROR')).message).toBe(
      'Something went wrong. Please try again.',
    );
  });

  it('a non-2xx HTTP response is a generic server error', () => {
    const error = new ServerError('Response not successful', {
      response: new Response('oops', { status: 502 }),
      bodyText: 'oops',
    });
    expect(describeError(error)).toEqual({ message: 'Something went wrong. Please try again.' });
  });

  it('a failed fetch is reported as a connection problem', () => {
    expect(describeError(new TypeError('Failed to fetch'))).toEqual({
      message: 'Could not reach the server. Check your connection and try again.',
    });
  });
});
