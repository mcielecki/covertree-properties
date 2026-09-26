import { ApolloClient, type ApolloCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { MockLink } from '@apollo/client/testing';
import { act, render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createCache } from '../apollo/client';
import { routes } from '../router';

/**
 * Renders the whole app (real routes) at `path`, with GraphQL answered by `mocks`. Resolves once
 * the router has loaded the page's lazy route module. `seed` writes to the cache before rendering,
 * e.g. to simulate data from an earlier visit.
 */
export async function renderApp(
  path: string,
  mocks: ReadonlyArray<MockLink.MockedResponse> = [],
  { seed }: { seed?: (cache: ApolloCache) => void } = {},
) {
  const cache = createCache();
  seed?.(cache);
  const client = new ApolloClient({ link: new MockLink(mocks), cache });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <ApolloProvider client={client}>
      <RouterProvider router={router} />
    </ApolloProvider>,
  );
  await act(
    () =>
      new Promise<void>((resolve) => {
        if (router.state.initialized) return resolve();
        const unsubscribe = router.subscribe((state) => {
          if (!state.initialized) return;
          unsubscribe();
          resolve();
        });
      }),
  );
  return { client, router };
}

/** A GraphQL execution error as the api sends it (SPEC §5). */
export function graphQLErrorResult(code: string, extensions: Record<string, unknown> = {}) {
  return {
    data: null,
    errors: [{ message: 'server message', extensions: { code, ...extensions } }],
  };
}
