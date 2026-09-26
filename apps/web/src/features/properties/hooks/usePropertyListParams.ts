import {
  citySchema,
  DEFAULT_LIMIT,
  stateSchema,
  zipCodeSchema,
  type USState,
} from '@covertree/validation';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { PropertiesQueryVariables } from '../../../gql/graphql';

export const PAGE_SIZE = DEFAULT_LIMIT;

export type SortDirection = 'asc' | 'desc';

/** The list view as encoded in the URL: `?city=&state=&zip=&sort=asc|desc&page=` (AC-W.2). */
export interface ListParams {
  city?: string;
  state?: USState;
  zip?: string;
  sort: SortDirection;
  /** 1-based. */
  page: number;
}

export type FilterParams = Pick<ListParams, 'city' | 'state' | 'zip'>;

/**
 * Reads the list view from the URL. Values that fail the shared validation rules are dropped,
 * so a hand-edited URL never turns into a BAD_USER_INPUT error.
 */
export function parseListParams(search: URLSearchParams): ListParams {
  const params: ListParams = {
    sort: search.get('sort') === 'asc' ? 'asc' : 'desc',
    page: parsePage(search.get('page')),
  };
  const city = citySchema.safeParse(search.get('city'));
  if (city.success) params.city = city.data;
  const state = stateSchema.safeParse(search.get('state'));
  if (state.success) params.state = state.data;
  const zip = zipCodeSchema.safeParse(search.get('zip'));
  if (zip.success) params.zip = zip.data;
  return params;
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/** Inverse of `parseListParams`. Defaults are omitted to keep URLs short. */
export function toSearchParams(params: ListParams): URLSearchParams {
  const search = new URLSearchParams();
  if (params.city) search.set('city', params.city);
  if (params.state) search.set('state', params.state);
  if (params.zip) search.set('zip', params.zip);
  if (params.sort === 'asc') search.set('sort', 'asc');
  if (params.page > 1) search.set('page', String(params.page));
  return search;
}

export function toQueryVariables(params: ListParams): PropertiesQueryVariables {
  const filter: NonNullable<PropertiesQueryVariables['filter']> = {};
  if (params.city) filter.city = params.city;
  if (params.state) filter.state = params.state;
  if (params.zip) filter.zipCode = params.zip;
  return {
    ...(Object.keys(filter).length > 0 && { filter }),
    sortOrder: params.sort === 'asc' ? 'ASC' : 'DESC',
    limit: PAGE_SIZE,
    offset: (params.page - 1) * PAGE_SIZE,
  };
}

/** URL ⇄ list view. Changing filters or sort goes back to page 1 (AC-W.3). */
export function usePropertyListParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseListParams(searchParams), [searchParams]);
  const variables = useMemo(() => toQueryVariables(params), [params]);

  const setFilters = useCallback(
    (filters: FilterParams) => {
      setSearchParams(toSearchParams({ sort: params.sort, ...filters, page: 1 }));
    },
    [params.sort, setSearchParams],
  );

  const setSort = useCallback(
    (sort: SortDirection) => {
      setSearchParams(toSearchParams({ ...params, sort, page: 1 }));
    },
    [params, setSearchParams],
  );

  const setPage = useCallback(
    (page: number, options?: { replace?: boolean }) => {
      setSearchParams(toSearchParams({ ...params, page }), options);
    },
    [params, setSearchParams],
  );

  return { params, variables, setFilters, setSort, setPage };
}
