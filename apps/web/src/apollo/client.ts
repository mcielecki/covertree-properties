import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

// Default InMemoryCache, no manual list merging (SPEC §6). One type policy: WeatherData has no id,
// so without `merge: true` the list's { temperature } would replace the details page's full object.
// Merging is safe because weather data never changes after creation (AC-4.5).
export function createCache(): InMemoryCache {
  return new InMemoryCache({ typePolicies: { WeatherData: { merge: true } } });
}

export function createApolloClient(
  uri = import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:4000/graphql',
): ApolloClient {
  return new ApolloClient({ link: new HttpLink({ uri }), cache: createCache() });
}
