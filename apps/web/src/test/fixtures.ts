import type { PropertiesQuery, PropertyQuery } from '../gql/graphql';

export const PROPERTY_ID = '6f1c1b8e-2f5a-4c1e-9d0a-3b7e5c2a1f00';

type ListItem = PropertiesQuery['properties']['items'][number];
type Details = NonNullable<PropertyQuery['property']>;

export function listItem(overrides: Partial<ListItem> = {}): ListItem {
  return {
    __typename: 'Property',
    id: PROPERTY_ID,
    street: '15528 E Golden Eagle Blvd',
    city: 'Fountain Hills',
    state: 'AZ',
    zipCode: '85268',
    createdAt: '2026-09-26T12:14:00.000Z',
    weatherData: { __typename: 'WeatherData', temperature: 95 },
    ...overrides,
  } as ListItem;
}

export function propertyPage(items: ListItem[], totalCount = items.length) {
  return { data: { properties: { __typename: 'PropertyPage', totalCount, items } } };
}

export function propertyDetails(overrides: Partial<Details> = {}): Details {
  return {
    __typename: 'Property',
    id: PROPERTY_ID,
    street: '15528 E Golden Eagle Blvd',
    city: 'Fountain Hills',
    state: 'AZ',
    zipCode: '85268',
    lat: 33.609,
    long: -111.729,
    createdAt: '2026-09-26T12:14:00.000Z',
    weatherData: {
      __typename: 'WeatherData',
      observationTime: '12:14 PM',
      temperature: 95,
      weatherDescriptions: ['Partly cloudy '],
      weatherIcons: [
        'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0002.png',
      ],
      feelsLike: 93,
      windSpeed: 8,
      windDir: 'WSW',
      humidity: 12,
    },
    ...overrides,
  } as Details;
}

/** Variables the list page sends for the plain, unfiltered first page. */
export const DEFAULT_LIST_VARIABLES = { sortOrder: 'DESC', limit: 20, offset: 0 } as const;
