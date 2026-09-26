import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { truncateAll } from '../helpers/db.js';
import {
  createIntegrationHarness,
  errorCodes,
  gql,
  insertMany,
  insertProperty,
} from '../helpers/graphql.js';

interface PropertiesData {
  properties: {
    items: { id: string; city: string; state: string; zipCode: string }[];
    totalCount: number;
  };
}

const PROPERTIES = /* GraphQL */ `
  query Properties($filter: PropertyFilter, $sortOrder: SortOrder, $limit: Int, $offset: Int) {
    properties(filter: $filter, sortOrder: $sortOrder, limit: $limit, offset: $offset) {
      items {
        id
        city
        state
        zipCode
      }
      totalCount
    }
  }
`;

const { prisma, weather, app } = createIntegrationHarness();

const list = (variables: Record<string, unknown> = {}) =>
  gql<PropertiesData>(app, PROPERTIES, variables);

const ids = async (variables: Record<string, unknown> = {}) =>
  (await list(variables)).body.data?.properties.items.map((item) => item.id);

beforeEach(async () => {
  await truncateAll(prisma);
  weather.reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('US-1 query all properties', () => {
  it('AC-1.1: returns an empty page when there are no properties', async () => {
    const response = await list();

    expect(response.body).toEqual({ data: { properties: { items: [], totalCount: 0 } } });
  });

  it('AC-1.2: returns every property when there are fewer than the default limit', async () => {
    await insertMany(prisma, 3);

    const { body } = await list();

    expect(body.data?.properties.items).toHaveLength(3);
    expect(body.data?.properties.totalCount).toBe(3);
  });

  it('AC-1.3: applies the default limit of 20', async () => {
    await insertMany(prisma, 25);

    const { body } = await list();

    expect(body.data?.properties.items).toHaveLength(20);
    expect(body.data?.properties.totalCount).toBe(25);
  });

  it('AC-1.4: paginates with limit and offset', async () => {
    await insertMany(prisma, 25);

    const { body } = await list({ limit: 10, offset: 20 });

    expect(body.data?.properties.items).toHaveLength(5);
    expect(body.data?.properties.totalCount).toBe(25);
  });

  it('treats explicit null limit/offset as the defaults (SPEC §2.3)', async () => {
    await insertMany(prisma, 25);

    const { body } = await list({ limit: null, offset: null });

    expect(body.data?.properties.items).toHaveLength(20);
  });

  it('accepts the maximum limit of 100', async () => {
    const { body } = await list({ limit: 100 });

    expect(body.errors).toBeUndefined();
  });

  it.each([
    [{ limit: 0 }, 'limit'],
    [{ limit: 101 }, 'limit'],
    [{ offset: -1 }, 'offset'],
  ])('AC-1.5: rejects %j with BAD_USER_INPUT and data null', async (variables, field) => {
    const response = await list(variables);

    expect(response.body.data).toBeNull();
    expect(errorCodes(response)).toEqual(['BAD_USER_INPUT']);
    expect(response.body.errors?.[0]?.extensions?.fieldErrors).toHaveProperty(field);
  });

  it('AC-1.6: never calls Weatherstack', async () => {
    await insertMany(prisma, 3);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await list();
    await list({ filter: { city: 'Fountain Hills' } });

    expect(weather.calls).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('US-2 sort by creation date', () => {
  it('AC-2.1: returns newest first by default', async () => {
    const [a, b, c] = await insertMany(prisma, 3);

    expect(await ids()).toEqual([c, b, a]);
  });

  it('AC-2.2: returns oldest first with sortOrder ASC', async () => {
    const [a, b, c] = await insertMany(prisma, 3);

    expect(await ids({ sortOrder: 'ASC' })).toEqual([a, b, c]);
  });

  it('AC-2.3: breaks createdAt ties by id, so the order is stable', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const first = await insertProperty(prisma, { street: '1 Main St' }, createdAt);
    const second = await insertProperty(prisma, { street: '2 Main St' }, createdAt);
    const descending = [first, second].sort().reverse();

    expect(await ids()).toEqual(descending);
    expect(await ids()).toEqual(descending);
    expect(await ids({ sortOrder: 'ASC' })).toEqual([...descending].reverse());
  });

  it('AC-2.4: filters, then sorts, then paginates; totalCount is the filtered size', async () => {
    const arizona = await insertMany(prisma, 5, { state: 'AZ' });
    await insertMany(prisma, 3, { state: 'CA', city: 'Los Angeles', zipCode: '90001' });

    const { body } = await list({ filter: { state: 'AZ' }, sortOrder: 'ASC', limit: 2, offset: 1 });

    expect(body.data?.properties.items.map((item) => item.id)).toEqual(arizona.slice(1, 3));
    expect(body.data?.properties.totalCount).toBe(5);
  });
});

describe('US-3 filter by city, zip code and state', () => {
  beforeEach(async () => {
    await insertProperty(prisma, {
      street: '1 A St',
      city: 'Fountain Hills',
      state: 'AZ',
      zipCode: '85268',
    });
    await insertProperty(prisma, {
      street: '2 A St',
      city: 'Fountain Hills',
      state: 'AZ',
      zipCode: '85268',
    });
    await insertProperty(prisma, {
      street: '3 A St',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
    });
    await insertProperty(prisma, {
      street: '4 A St',
      city: 'Phoenix',
      state: 'CA',
      zipCode: '90001',
    });
  });

  const cities = async (filter: Record<string, unknown>) =>
    (await list({ filter })).body.data?.properties.items.map((item) => item.city).sort();

  it('AC-3.1: matches the city case-insensitively', async () => {
    expect(await cities({ city: 'fountain hills' })).toEqual(['Fountain Hills', 'Fountain Hills']);
  });

  it('AC-3.2: matches the whole city, not a prefix or substring', async () => {
    const { body } = await list({ filter: { city: 'Fountain' } });

    expect(body.data?.properties).toEqual({ items: [], totalCount: 0 });
  });

  it('AC-3.3: normalizes whitespace in the city filter', async () => {
    expect(await cities({ city: '  Fountain   Hills ' })).toEqual([
      'Fountain Hills',
      'Fountain Hills',
    ]);
  });

  it('AC-3.4: filters by zip code', async () => {
    const { body } = await list({ filter: { zipCode: '85268' } });

    expect(body.data?.properties.items.map((item) => item.zipCode)).toEqual(['85268', '85268']);
  });

  it('AC-3.5: filters by state', async () => {
    const { body } = await list({ filter: { state: 'CA' } });

    expect(body.data?.properties.items.map((item) => item.state)).toEqual(['CA']);
  });

  it('AC-3.6: combines filter fields with AND', async () => {
    const { body } = await list({ filter: { city: 'Phoenix', state: 'AZ' } });

    expect(body.data?.properties.items).toEqual([
      expect.objectContaining({ city: 'Phoenix', state: 'AZ', zipCode: '85001' }),
    ]);
  });

  it.each([
    [{ zipCode: '852' }, 'zipCode'],
    [{ city: '   ' }, 'city'],
    [{ city: 'Phoenix1' }, 'city'],
    [{ city: 'x'.repeat(101) }, 'city'],
  ])('AC-3.7: rejects an invalid filter %j with BAD_USER_INPUT', async (filter, field) => {
    const response = await list({ filter });

    expect(errorCodes(response)).toEqual(['BAD_USER_INPUT']);
    expect(response.body.errors?.[0]?.extensions?.fieldErrors).toHaveProperty(field);
  });

  it('AC-3.8: rejects an unknown state literal with GRAPHQL_VALIDATION_FAILED', async () => {
    const response = await gql(app, '{ properties(filter: { state: XX }) { totalCount } }');

    expect(response.status).toBe(400);
    expect(errorCodes(response)).toEqual(['GRAPHQL_VALIDATION_FAILED']);
  });

  it('AC-3.8: rejects an unknown state passed as a variable with HTTP 400 (SPEC §5)', async () => {
    const response = await list({ filter: { state: 'XX' } });

    // Variable coercion error from graphql-js: no data, no extensions.code.
    expect(response.status).toBe(400);
    expect(response.body.data).toBeUndefined();
    expect(response.body.errors).toEqual([
      expect.objectContaining({ message: expect.stringContaining('"USState" enum') as unknown }),
    ]);
    expect(response.body.errors?.[0]?.extensions?.code).toBeUndefined();
  });

  it.each([{}, { city: null, zipCode: null, state: null }, null])(
    'AC-3.9: an omitted or null filter field does not constrain the result (%j)',
    async (filter) => {
      const { body } = await list({ filter });

      expect(body.data?.properties.totalCount).toBe(4);
    },
  );
});
