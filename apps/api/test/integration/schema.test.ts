import { afterAll, describe, expect, it } from 'vitest';
import { createIntegrationHarness, errorCodes, gql } from '../helpers/graphql.js';

interface TypeData {
  __type: {
    fields?: { name: string; type: TypeRef }[] | null;
    inputFields?: { name: string; type: TypeRef }[] | null;
  } | null;
}

interface TypeRef {
  kind: string;
  name: string | null;
  ofType: TypeRef | null;
}

const TYPE = /* GraphQL */ `
  query Type($name: String!) {
    __type(name: $name) {
      fields {
        name
        type {
          ...Ref
        }
      }
      inputFields {
        name
        type {
          ...Ref
        }
      }
    }
  }
  fragment Ref on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
            }
          }
        }
      }
    }
  }
`;

/** Renders an introspected type reference as SDL, e.g. "[String!]!". */
function sdl(type: TypeRef): string {
  if (type.kind === 'NON_NULL' && type.ofType) return `${sdl(type.ofType)}!`;
  if (type.kind === 'LIST' && type.ofType) return `[${sdl(type.ofType)}]`;
  return type.name ?? '?';
}

const { prisma, weather, app } = createIntegrationHarness();

async function fieldsOf(name: string): Promise<Record<string, string>> {
  const { body } = await gql<TypeData>(app, TYPE, { name });
  const type = body.data?.__type;
  const fields = type?.fields ?? type?.inputFields ?? [];
  return Object.fromEntries(fields.map((field) => [field.name, sdl(field.type)]));
}

afterAll(async () => {
  await prisma.$disconnect();
});

describe('US-7 property fields', () => {
  it('AC-7.1: Property exposes exactly the specified fields', async () => {
    expect(await fieldsOf('Property')).toEqual({
      id: 'ID!',
      street: 'String!',
      city: 'String!',
      state: 'USState!',
      zipCode: 'String!',
      lat: 'Float!',
      long: 'Float!',
      weatherData: 'WeatherData!',
      createdAt: 'DateTime!',
    });
  });

  it('WeatherData: four required fields, the rest nullable', async () => {
    expect(await fieldsOf('WeatherData')).toEqual({
      observationTime: 'String!',
      temperature: 'Float!',
      weatherDescriptions: '[String!]!',
      weatherIcons: '[String!]!',
      feelsLike: 'Float',
      weatherCode: 'Int',
      windSpeed: 'Float',
      windDegree: 'Int',
      windDir: 'String',
      pressure: 'Float',
      precip: 'Float',
      humidity: 'Int',
      cloudCover: 'Int',
      uvIndex: 'Float',
      visibility: 'Float',
      isDay: 'Boolean',
    });
  });

  it('AC-7.2 / AC-7.3: CreatePropertyInput accepts only the address fields', async () => {
    expect(await fieldsOf('CreatePropertyInput')).toEqual({
      street: 'String!',
      city: 'String!',
      state: 'USState!',
      zipCode: 'String!',
    });
  });

  it.each([
    'id: "00000000-0000-4000-8000-000000000000"',
    'createdAt: "2020-01-01T00:00:00Z"',
    'lat: 1',
    'long: 1',
  ])('AC-7.2 / AC-7.3: rejects a client-supplied %s', async (extra) => {
    const response = await gql(
      app,
      `mutation {
          createProperty(input: { street: "1 Main St", city: "Phoenix", state: AZ, zipCode: "85001", ${extra} }) { id }
        }`,
    );

    expect(errorCodes(response)).toEqual(['GRAPHQL_VALIDATION_FAILED']);
    expect(weather.calls).toEqual([]);
  });

  it('does not expose the internal key columns', async () => {
    const fields = Object.keys(await fieldsOf('Property'));

    expect(fields).not.toContain('cityKey');
    expect(fields).not.toContain('addressKey');
  });
});
