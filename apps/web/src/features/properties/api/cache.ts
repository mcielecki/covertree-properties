import type { ApolloCache } from '@apollo/client';

/**
 * Removes a deleted property from the cache, so no page can serve it afterwards (AC-W.6).
 * No broadcast: a details query that is still mounted would otherwise refetch the property that
 * was just deleted.
 */
export function evictProperty(cache: ApolloCache, id: string): void {
  cache.evict({ id: cache.identify({ __typename: 'Property', id }), broadcast: false });
  cache.gc();
}
