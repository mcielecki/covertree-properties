import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { truncateAll } from '../helpers/db.js';
import { createIntegrationHarness, errorCodes, gql, insertProperty } from '../helpers/graphql.js';

const DELETE = /* GraphQL */ `
  mutation Delete($id: ID!) {
    deleteProperty(id: $id)
  }
`;

const PROPERTY = /* GraphQL */ `
  query Property($id: ID!) {
    property(id: $id) {
      id
    }
  }
`;

const { prisma, weather, app } = createIntegrationHarness();

beforeEach(async () => {
  await truncateAll(prisma);
  weather.reset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('US-6 delete a property', () => {
  it('AC-6.1: returns the deleted id, after which the property is gone', async () => {
    const id = await insertProperty(prisma);
    const other = await insertProperty(prisma, { street: '1 Other St' });

    const response = await gql<{ deleteProperty: string }>(app, DELETE, { id });

    expect(response.body).toEqual({ data: { deleteProperty: id } });
    const lookup = await gql<{ property: unknown }>(app, PROPERTY, { id });
    expect(lookup.body).toEqual({ data: { property: null } });
    expect(await prisma.property.findMany({ select: { id: true } })).toEqual([{ id: other }]);
  });

  it('AC-6.2: fails with NOT_FOUND for an unknown id', async () => {
    const id = '00000000-0000-4000-8000-000000000000';

    const response = await gql(app, DELETE, { id });

    expect(response.body.data).toBeNull();
    expect(response.body.errors?.[0]).toMatchObject({
      message: 'Property not found',
      extensions: { code: 'NOT_FOUND', id },
    });
  });

  it('AC-6.3: rejects a malformed id with BAD_USER_INPUT', async () => {
    const response = await gql(app, DELETE, { id: '123' });

    expect(errorCodes(response)).toEqual(['BAD_USER_INPUT']);
    expect(response.body.errors?.[0]?.extensions?.fieldErrors).toEqual({ id: ['Invalid id'] });
  });

  it('never calls Weatherstack', async () => {
    const id = await insertProperty(prisma);

    await gql(app, DELETE, { id });

    expect(weather.calls).toEqual([]);
  });
});
