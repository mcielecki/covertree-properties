import { ApolloClient } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { MockLink } from '@apollo/client/testing';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createCache } from '../apollo/client';
import { routes } from '../router';

/** Renders the whole app (real routes) at `path`, with GraphQL answered by `mocks`. */
export function renderApp(path: string, mocks: ReadonlyArray<MockLink.MockedResponse> = []) {
  const client = new ApolloClient({ link: new MockLink(mocks), cache: createCache() });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <ApolloProvider client={client}>
      <RouterProvider router={router} />
    </ApolloProvider>,
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
