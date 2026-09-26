import { describe, expect, it } from 'vitest';
import {
  PAGE_SIZE,
  parseListParams,
  toQueryVariables,
  toSearchParams,
  type ListParams,
} from './usePropertyListParams';

const defaults: ListParams = { sort: 'desc', page: 1 };

describe('parseListParams', () => {
  it('an empty query string gives newest first, page 1, no filters', () => {
    expect(parseListParams(new URLSearchParams())).toEqual(defaults);
  });

  it('reads every supported parameter (AC-W.2)', () => {
    expect(
      parseListParams(
        new URLSearchParams('city=Fountain+Hills&state=AZ&zip=85268&sort=asc&page=3'),
      ),
    ).toEqual({ city: 'Fountain Hills', state: 'AZ', zip: '85268', sort: 'asc', page: 3 });
  });

  it('normalizes the city with the shared rules', () => {
    expect(parseListParams(new URLSearchParams('city=%20Fountain%20%20Hills%20')).city).toBe(
      'Fountain Hills',
    );
  });

  it.each([
    ['city=123', 'city'],
    ['city=%20%20', 'city'],
    ['zip=852', 'zip'],
    ['zip=85268-1234', 'zip'],
    ['state=XX', 'state'],
    ['state=az', 'state'],
  ] as const)('drops an invalid value (%s) instead of sending it to the API', (query, key) => {
    expect(parseListParams(new URLSearchParams(query))[key]).toBeUndefined();
  });

  it.each(['0', '-1', '1.5', 'abc', ''])('falls back to page 1 for page=%s', (page) => {
    expect(parseListParams(new URLSearchParams({ page })).page).toBe(1);
  });

  it('treats any sort other than "asc" as newest first', () => {
    expect(parseListParams(new URLSearchParams('sort=sideways')).sort).toBe('desc');
  });
});

describe('toSearchParams', () => {
  it('omits defaults so the plain list has a clean URL', () => {
    expect(toSearchParams(defaults).toString()).toBe('');
  });

  it('round-trips through parseListParams (reload restores the view)', () => {
    const params: ListParams = { city: 'Phoenix', state: 'AZ', zip: '85001', sort: 'asc', page: 2 };
    expect(parseListParams(toSearchParams(params))).toEqual(params);
  });
});

describe('toQueryVariables', () => {
  it('maps defaults to DESC, first page, no filter', () => {
    expect(toQueryVariables(defaults)).toEqual({ sortOrder: 'DESC', limit: PAGE_SIZE, offset: 0 });
  });

  it('maps page to offset and filters to the PropertyFilter input (AC-W.3)', () => {
    expect(
      toQueryVariables({ city: 'Phoenix', state: 'AZ', zip: '85001', sort: 'asc', page: 3 }),
    ).toEqual({
      filter: { city: 'Phoenix', state: 'AZ', zipCode: '85001' },
      sortOrder: 'ASC',
      limit: PAGE_SIZE,
      offset: 2 * PAGE_SIZE,
    });
  });

  it('only includes the filter fields that are set (AC-3.9)', () => {
    expect(toQueryVariables({ ...defaults, state: 'CA' }).filter).toEqual({ state: 'CA' });
  });
});
