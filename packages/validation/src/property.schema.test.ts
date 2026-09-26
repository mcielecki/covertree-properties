import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  citySchema,
  createPropertyInputSchema,
  idSchema,
  paginationSchema,
  propertyFilterSchema,
  stateSchema,
  streetSchema,
  zipCodeSchema,
} from './property.schema.js';
import { US_STATES } from './us-states.js';

const validInput = {
  street: '15528 E Golden Eagle Blvd',
  city: 'Fountain Hills',
  state: 'AZ',
  zipCode: '85268',
};

describe('streetSchema', () => {
  it.each(['', '   ', '\t\n'])('AC-5.4: rejects empty or whitespace-only %j', (value) => {
    expect(streetSchema.safeParse(value).success).toBe(false);
  });

  it('AC-5.4: accepts 1 and 200 characters, rejects 201', () => {
    expect(streetSchema.safeParse('a').success).toBe(true);
    expect(streetSchema.safeParse('a'.repeat(200)).success).toBe(true);
    expect(streetSchema.safeParse('a'.repeat(201)).success).toBe(false);
  });

  it('measures length after normalization', () => {
    expect(streetSchema.safeParse(`  ${'a'.repeat(200)}  `).success).toBe(true);
  });

  it('rejects control characters', () => {
    expect(streetSchema.safeParse('Main\u0000St').success).toBe(false);
    expect(streetSchema.safeParse('Main St\u007f').success).toBe(false);
  });

  it('AC-5.6: returns the normalized value', () => {
    expect(streetSchema.parse('  15528  E Golden Eagle Blvd ')).toBe('15528 E Golden Eagle Blvd');
  });
});

describe('citySchema', () => {
  it.each(['', '   '])('AC-5.4: rejects empty or whitespace-only %j', (value) => {
    expect(citySchema.safeParse(value).success).toBe(false);
  });

  it('AC-5.4: accepts 1 and 100 characters, rejects 101', () => {
    expect(citySchema.safeParse('A').success).toBe(true);
    expect(citySchema.safeParse('A'.repeat(100)).success).toBe(true);
    expect(citySchema.safeParse('A'.repeat(101)).success).toBe(false);
  });

  it.each(['Fountain Hills', 'St. Louis', "Coeur d'Alene", 'Winston-Salem', 'Española'])(
    'accepts %j',
    (value) => {
      expect(citySchema.parse(value)).toBe(value);
    },
  );

  it.each(['123City', '-Foo', '.Foo', "'Foo", 'Foo@Bar', 'Foo1', 'Foo_Bar'])(
    'AC-3.7: rejects %j',
    (value) => {
      expect(citySchema.safeParse(value).success).toBe(false);
    },
  );

  it('AC-3.3 / AC-5.6: returns the normalized value with casing kept', () => {
    expect(citySchema.parse('  Fountain   Hills ')).toBe('Fountain Hills');
  });
});

describe('zipCodeSchema', () => {
  it.each(['85268', '02134'])('accepts %j unchanged', (value) => {
    expect(zipCodeSchema.parse(value)).toBe(value);
  });

  it.each(['8526', '852680', '8526a', '85268-1234', '852', '', ' 85268', '85268 '])(
    'AC-5.3 / AC-3.7: rejects %j',
    (value) => {
      expect(zipCodeSchema.safeParse(value).success).toBe(false);
    },
  );
});

describe('stateSchema', () => {
  it('accepts every US_STATES value', () => {
    for (const state of US_STATES) expect(stateSchema.parse(state)).toBe(state);
  });

  it.each(['XX', 'az', 'PR', ''])('rejects %j', (value) => {
    expect(stateSchema.safeParse(value).success).toBe(false);
  });
});

describe('createPropertyInputSchema', () => {
  it('AC-5.1: accepts valid input', () => {
    expect(createPropertyInputSchema.parse(validInput)).toEqual(validInput);
  });

  it('AC-5.6: normalizes street and city', () => {
    const result = createPropertyInputSchema.parse({
      ...validInput,
      street: '  15528  E Golden Eagle Blvd ',
      city: ' Fountain  Hills',
    });
    expect(result.street).toBe('15528 E Golden Eagle Blvd');
    expect(result.city).toBe('Fountain Hills');
  });

  it('reports each invalid field under its own path', () => {
    const result = createPropertyInputSchema.safeParse({
      street: ' ',
      city: 'Foo1',
      state: 'XX',
      zipCode: '8526',
    });
    expect(result.success).toBe(false);
    const { fieldErrors } = z.flattenError(result.error!);
    expect(Object.keys(fieldErrors).sort()).toEqual(['city', 'state', 'street', 'zipCode']);
  });

  it('gives human-readable messages', () => {
    const result = createPropertyInputSchema.safeParse({ ...validInput, zipCode: '8526' });
    expect(z.flattenError(result.error!).fieldErrors.zipCode).toEqual([
      'Zip code must be exactly 5 digits',
    ]);
  });

  it('reports a single message for an empty field', () => {
    const result = createPropertyInputSchema.safeParse({ ...validInput, city: '   ' });
    expect(z.flattenError(result.error!).fieldErrors.city).toEqual(['City is required']);
  });

  it('AC-7.2 / AC-7.3: strips client-supplied id, lat, long and createdAt', () => {
    const result = createPropertyInputSchema.parse({
      ...validInput,
      id: 'x',
      lat: 1,
      long: 2,
      createdAt: 'now',
    });
    expect(result).toEqual(validInput);
  });

  it('requires every field', () => {
    expect(createPropertyInputSchema.safeParse({}).success).toBe(false);
  });
});

describe('propertyFilterSchema', () => {
  it.each([undefined, null])('AC-3.9: accepts a %j filter as no constraint', (value) => {
    expect(propertyFilterSchema.parse(value)).toEqual({});
  });

  it('AC-3.9: drops null and omitted fields', () => {
    const result = propertyFilterSchema.parse({ city: null, zipCode: null, state: 'AZ' });
    expect(result).toEqual({ state: 'AZ' });
    expect(result).not.toHaveProperty('city');
    expect(result).not.toHaveProperty('zipCode');
  });

  it('AC-3.3: normalizes city', () => {
    expect(propertyFilterSchema.parse({ city: '  Fountain   Hills ' })).toEqual({
      city: 'Fountain Hills',
    });
  });

  it('AC-3.6: keeps all supplied fields', () => {
    expect(propertyFilterSchema.parse({ city: 'Phoenix', state: 'AZ', zipCode: '85001' })).toEqual({
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
    });
  });

  it.each([{ zipCode: '852' }, { city: 'Foo1' }, { city: '' }, { city: '   ' }, { state: 'XX' }])(
    'AC-3.7: rejects %j',
    (value) => {
      expect(propertyFilterSchema.safeParse(value).success).toBe(false);
    },
  );
});

describe('paginationSchema', () => {
  it('AC-1.3: defaults to limit 20, offset 0', () => {
    expect(paginationSchema.parse({})).toEqual({ limit: 20, offset: 0 });
  });

  it('treats explicit null as the default', () => {
    expect(paginationSchema.parse({ limit: null, offset: null })).toEqual({ limit: 20, offset: 0 });
  });

  it('AC-1.4: accepts the boundaries', () => {
    expect(paginationSchema.parse({ limit: 1, offset: 0 })).toEqual({ limit: 1, offset: 0 });
    expect(paginationSchema.parse({ limit: 100, offset: 20 })).toEqual({ limit: 100, offset: 20 });
  });

  it.each([{ limit: 0 }, { limit: 101 }, { offset: -1 }, { limit: 1.5 }, { offset: 0.5 }])(
    'AC-1.5: rejects %j',
    (value) => {
      expect(paginationSchema.safeParse(value).success).toBe(false);
    },
  );
});

describe('idSchema', () => {
  it('accepts a v4 UUID', () => {
    const id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    expect(idSchema.parse(id)).toBe(id);
  });

  it.each(['abc', '', 'f47ac10b-58cc-4372-a567-0e02b2c3d479x', 'f47ac10b58cc4372a5670e02b2c3d479'])(
    'AC-4.3 / AC-6.3: rejects %j',
    (value) => {
      expect(idSchema.safeParse(value).success).toBe(false);
    },
  );
});
