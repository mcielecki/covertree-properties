import { CombinedGraphQLErrors, ServerError, ServerParseError } from '@apollo/client';

export interface ErrorDescription {
  /** Human-readable text for the user. */
  message: string;
  /** `extensions.code` of the first GraphQL error, when the server sent one. */
  code?: string;
  /** ALREADY_EXISTS: the id of the property with the same address, when the server knows it. */
  existingId?: string;
  /** BAD_USER_INPUT: the first message per input field. */
  fieldErrors?: Record<string, string>;
}

const GENERIC = 'Something went wrong. Please try again.';

/**
 * Turns an Apollo error into text for the user (SPEC §5). Switches on `extensions.code` only,
 * never on the server's message.
 */
export function describeError(error: unknown): ErrorDescription {
  if (!CombinedGraphQLErrors.is(error)) {
    if (ServerError.is(error) || ServerParseError.is(error)) return { message: GENERIC };
    // fetch itself failed: server down, CORS, offline.
    return { message: 'Could not reach the server. Check your connection and try again.' };
  }

  const extensions = error.errors[0]?.extensions ?? {};
  const code = typeof extensions.code === 'string' ? extensions.code : undefined;

  switch (code) {
    case 'ALREADY_EXISTS':
      return {
        code,
        message: 'A property with this address already exists.',
        ...(typeof extensions.id === 'string' && { existingId: extensions.id }),
      };
    case 'LOCATION_NOT_FOUND': {
      const zip =
        typeof extensions.zipCode === 'string' ? `zip code ${extensions.zipCode}` : 'this zip code';
      return {
        code,
        message: `We couldn't find a US location for ${zip}. Check the zip code and try again.`,
      };
    }
    case 'WEATHER_SERVICE_UNAVAILABLE':
      return {
        code,
        message:
          'The weather service is unavailable right now, so the property was not saved. Please try again later.',
      };
    case 'BAD_USER_INPUT':
      return {
        code,
        message: 'Some fields are invalid. Check the highlighted fields.',
        fieldErrors: firstMessagePerField(extensions.fieldErrors),
      };
    case 'NOT_FOUND':
      return { code, message: 'This property no longer exists.' };
    default:
      return { ...(code && { code }), message: GENERIC };
  }
}

function firstMessagePerField(value: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (typeof value !== 'object' || value === null) return result;
  for (const [field, messages] of Object.entries(value)) {
    if (Array.isArray(messages) && typeof messages[0] === 'string') result[field] = messages[0];
  }
  return result;
}
