import { normalizeWhitespace, type USState } from '@covertree/validation';

export interface AddressParts {
  street: string;
  city: string;
  state: USState;
  zipCode: string;
}

/** Normalized, lowercased city. Stored in `cityKey` and used for the exact-match city filter. */
export function toCityKey(city: string): string {
  return normalizeWhitespace(city).toLowerCase();
}

/**
 * Normalized, lowercased "street|city|state|zip". Unique per property.
 * `|` cannot appear in a valid city, so text cannot shift between fields.
 */
export function toAddressKey({ street, city, state, zipCode }: AddressParts): string {
  return [normalizeWhitespace(street), normalizeWhitespace(city), state, zipCode]
    .join('|')
    .toLowerCase();
}
