import { describe, expect, it } from 'vitest';
import { PROPERTIES_QUERY, PROPERTY_QUERY } from '../features/properties/api/queries';
import { listItem, PROPERTY_ID, propertyDetails, propertyPage } from '../test/fixtures';
import { createCache } from './client';

describe('createCache', () => {
  it('keeps the full weatherData of a property when the list writes its partial selection', () => {
    const cache = createCache();
    const details = propertyDetails();
    cache.writeQuery({
      query: PROPERTY_QUERY,
      variables: { id: PROPERTY_ID },
      data: { property: details },
    });

    cache.writeQuery({
      query: PROPERTIES_QUERY,
      variables: { sortOrder: 'DESC', limit: 20, offset: 0 },
      data: propertyPage([listItem()]).data,
    });

    // Without a merge policy the list's { temperature } replaces the object and this read is incomplete.
    expect(
      cache.readQuery({ query: PROPERTY_QUERY, variables: { id: PROPERTY_ID } })?.property
        ?.weatherData,
    ).toEqual(details.weatherData);
  });
});
