import type { DocumentNode } from 'graphql';
export const typeDefs = {
  kind: 'Document',
  definitions: [
    {
      kind: 'ScalarTypeDefinition',
      description: {
        kind: 'StringValue',
        value: 'ISO-8601 date-time string on the wire.',
        block: false,
      },
      name: { kind: 'Name', value: 'DateTime' },
      directives: [],
    },
    {
      kind: 'EnumTypeDefinition',
      name: { kind: 'Name', value: 'SortOrder' },
      directives: [],
      values: [
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'ASC' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'DESC' }, directives: [] },
      ],
    },
    {
      name: { kind: 'Name', value: 'Query' },
      kind: 'ObjectTypeDefinition',
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'properties' },
          arguments: [
            {
              kind: 'InputValueDefinition',
              name: { kind: 'Name', value: 'filter' },
              type: { kind: 'NamedType', name: { kind: 'Name', value: 'PropertyFilter' } },
              directives: [],
            },
            {
              kind: 'InputValueDefinition',
              name: { kind: 'Name', value: 'sortOrder' },
              type: { kind: 'NamedType', name: { kind: 'Name', value: 'SortOrder' } },
              defaultValue: { kind: 'EnumValue', value: 'DESC' },
              directives: [],
            },
            {
              kind: 'InputValueDefinition',
              description: { kind: 'StringValue', value: '1..100', block: false },
              name: { kind: 'Name', value: 'limit' },
              type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
              defaultValue: { kind: 'IntValue', value: '20' },
              directives: [],
            },
            {
              kind: 'InputValueDefinition',
              description: { kind: 'StringValue', value: '>= 0', block: false },
              name: { kind: 'Name', value: 'offset' },
              type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
              defaultValue: { kind: 'IntValue', value: '0' },
              directives: [],
            },
          ],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'PropertyPage' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          description: {
            kind: 'StringValue',
            value: 'Returns null if no property has this id.',
            block: false,
          },
          name: { kind: 'Name', value: 'property' },
          arguments: [
            {
              kind: 'InputValueDefinition',
              name: { kind: 'Name', value: 'id' },
              type: {
                kind: 'NonNullType',
                type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
              },
              directives: [],
            },
          ],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Property' } },
          directives: [],
        },
      ],
      directives: [],
      interfaces: [],
    },
    {
      name: { kind: 'Name', value: 'Mutation' },
      kind: 'ObjectTypeDefinition',
      fields: [
        {
          kind: 'FieldDefinition',
          description: {
            kind: 'StringValue',
            value:
              'Creates a property. Calls Weatherstack once to fetch current weather and coordinates.\nFails without persisting anything if the weather lookup fails.',
            block: true,
          },
          name: { kind: 'Name', value: 'createProperty' },
          arguments: [
            {
              kind: 'InputValueDefinition',
              name: { kind: 'Name', value: 'input' },
              type: {
                kind: 'NonNullType',
                type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreatePropertyInput' } },
              },
              directives: [],
            },
          ],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Property' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          description: {
            kind: 'StringValue',
            value:
              'Hard-deletes a property. Returns its id. Fails with NOT_FOUND if it does not exist.',
            block: false,
          },
          name: { kind: 'Name', value: 'deleteProperty' },
          arguments: [
            {
              kind: 'InputValueDefinition',
              name: { kind: 'Name', value: 'id' },
              type: {
                kind: 'NonNullType',
                type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
              },
              directives: [],
            },
          ],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
          directives: [],
        },
      ],
      directives: [],
      interfaces: [],
    },
    {
      kind: 'EnumTypeDefinition',
      description: {
        kind: 'StringValue',
        value: 'Two-letter USPS abbreviations: the 50 states and the District of Columbia.',
        block: true,
      },
      name: { kind: 'Name', value: 'USState' },
      directives: [],
      values: [
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'AL' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'AK' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'AZ' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'AR' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'CA' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'CO' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'CT' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'DE' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'DC' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'FL' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'GA' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'HI' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'ID' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'IL' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'IN' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'IA' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'KS' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'KY' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'LA' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'ME' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'MD' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'MA' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'MI' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'MN' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'MS' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'MO' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'MT' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'NE' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'NV' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'NH' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'NJ' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'NM' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'NY' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'NC' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'ND' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'OH' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'OK' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'OR' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'PA' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'RI' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'SC' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'SD' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'TN' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'TX' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'UT' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'VT' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'VA' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'WA' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'WV' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'WI' }, directives: [] },
        { kind: 'EnumValueDefinition', name: { kind: 'Name', value: 'WY' }, directives: [] },
      ],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'Property' },
      interfaces: [],
      directives: [],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'id' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          description: {
            kind: 'StringValue',
            value: "Street name and number, e.g. '15528 E Golden Eagle Blvd'.",
            block: false,
          },
          name: { kind: 'Name', value: 'street' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'city' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'state' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'USState' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          description: {
            kind: 'StringValue',
            value: 'Exactly 5 digits. A string, so leading zeros are preserved.',
            block: false,
          },
          name: { kind: 'Name', value: 'zipCode' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          description: {
            kind: 'StringValue',
            value:
              'Latitude of the location Weatherstack resolved for the zip code (not the exact street address).',
            block: false,
          },
          name: { kind: 'Name', value: 'lat' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          description: {
            kind: 'StringValue',
            value:
              'Longitude of the location Weatherstack resolved for the zip code (not the exact street address).',
            block: false,
          },
          name: { kind: 'Name', value: 'long' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          description: {
            kind: 'StringValue',
            value: 'Weather observed when the property was created. Never refreshed.',
            block: false,
          },
          name: { kind: 'Name', value: 'weatherData' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'WeatherData' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'createdAt' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'DateTime' } },
          },
          directives: [],
        },
      ],
    },
    {
      kind: 'ObjectTypeDefinition',
      description: {
        kind: 'StringValue',
        value:
          "Weatherstack `current` object, units = Fahrenheit ('f'):\ntemperature/feelsLike in °F, windSpeed in mph, pressure in mb,\nprecip in inches, visibility in miles.\nOnly the first four fields are guaranteed; the rest are null when Weatherstack omits them.",
        block: true,
      },
      name: { kind: 'Name', value: 'WeatherData' },
      interfaces: [],
      directives: [],
      fields: [
        {
          kind: 'FieldDefinition',
          description: {
            kind: 'StringValue',
            value: "Time of observation in UTC, as returned by Weatherstack, e.g. '12:14 PM'.",
            block: false,
          },
          name: { kind: 'Name', value: 'observationTime' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'temperature' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'weatherDescriptions' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
              },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'weatherIcons' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
              },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'feelsLike' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'weatherCode' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'windSpeed' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'windDegree' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'windDir' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'pressure' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'precip' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'humidity' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'cloudCover' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'uvIndex' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'visibility' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'isDay' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
          directives: [],
        },
      ],
    },
    {
      kind: 'InputObjectTypeDefinition',
      name: { kind: 'Name', value: 'PropertyFilter' },
      directives: [],
      fields: [
        {
          kind: 'InputValueDefinition',
          description: {
            kind: 'StringValue',
            value: 'Case-insensitive exact match.',
            block: false,
          },
          name: { kind: 'Name', value: 'city' },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          directives: [],
        },
        {
          kind: 'InputValueDefinition',
          description: { kind: 'StringValue', value: 'Exactly 5 digits.', block: false },
          name: { kind: 'Name', value: 'zipCode' },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          directives: [],
        },
        {
          kind: 'InputValueDefinition',
          name: { kind: 'Name', value: 'state' },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'USState' } },
          directives: [],
        },
      ],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'PropertyPage' },
      interfaces: [],
      directives: [],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'items' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: { kind: 'NamedType', name: { kind: 'Name', value: 'Property' } },
              },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          description: {
            kind: 'StringValue',
            value: 'Total number of properties matching the filter, ignoring limit/offset.',
            block: false,
          },
          name: { kind: 'Name', value: 'totalCount' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          directives: [],
        },
      ],
    },
    {
      kind: 'InputObjectTypeDefinition',
      name: { kind: 'Name', value: 'CreatePropertyInput' },
      directives: [],
      fields: [
        {
          kind: 'InputValueDefinition',
          name: { kind: 'Name', value: 'street' },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
          directives: [],
        },
        {
          kind: 'InputValueDefinition',
          name: { kind: 'Name', value: 'city' },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
          directives: [],
        },
        {
          kind: 'InputValueDefinition',
          name: { kind: 'Name', value: 'state' },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'USState' } },
          },
          directives: [],
        },
        {
          kind: 'InputValueDefinition',
          name: { kind: 'Name', value: 'zipCode' },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
          directives: [],
        },
      ],
    },
    {
      kind: 'SchemaDefinition',
      operationTypes: [
        {
          kind: 'OperationTypeDefinition',
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Query' } },
          operation: 'query',
        },
        {
          kind: 'OperationTypeDefinition',
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Mutation' } },
          operation: 'mutation',
        },
      ],
    },
  ],
} as unknown as DocumentNode;
