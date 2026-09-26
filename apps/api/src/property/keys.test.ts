import { describe, expect, it } from 'vitest';
import { toAddressKey, toCityKey } from './keys.js';

const address = {
  street: '15528 E Golden Eagle Blvd',
  city: 'Fountain Hills',
  state: 'AZ',
  zipCode: '85268',
} as const;

describe('toCityKey', () => {
  it('lowercases the city', () => {
    expect(toCityKey('Fountain Hills')).toBe('fountain hills');
  });

  it('AC-3.3: trims and collapses whitespace', () => {
    expect(toCityKey('  Fountain   Hills ')).toBe('fountain hills');
  });

  it('AC-3.1: gives the same key for a stored value and a differently cased filter input', () => {
    expect(toCityKey('fountain HILLS')).toBe(toCityKey('Fountain Hills'));
  });

  it('keeps non-ASCII letters', () => {
    expect(toCityKey('Cañon City')).toBe('cañon city');
  });
});

describe('toAddressKey', () => {
  it('joins normalized, lowercased fields in street|city|state|zip order', () => {
    expect(toAddressKey(address)).toBe('15528 e golden eagle blvd|fountain hills|az|85268');
  });

  it('AC-5.7: ignores case and whitespace differences in street and city', () => {
    const variant = {
      ...address,
      street: '  15528  e GOLDEN eagle   Blvd ',
      city: ' FOUNTAIN  hills',
    };
    expect(toAddressKey(variant)).toBe(toAddressKey(address));
  });

  it('distinguishes addresses that differ in any field', () => {
    const key = toAddressKey(address);
    expect(toAddressKey({ ...address, street: '15529 E Golden Eagle Blvd' })).not.toBe(key);
    expect(toAddressKey({ ...address, city: 'Phoenix' })).not.toBe(key);
    expect(toAddressKey({ ...address, state: 'CA' })).not.toBe(key);
    expect(toAddressKey({ ...address, zipCode: '85269' })).not.toBe(key);
  });

  it('uses a separator so text cannot shift between street and city', () => {
    const a = toAddressKey({ ...address, street: '1 Main St Fountain', city: 'Hills' });
    const b = toAddressKey({ ...address, street: '1 Main St', city: 'Fountain Hills' });
    expect(a).not.toBe(b);
  });
});
