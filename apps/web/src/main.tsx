import { ApolloProvider } from '@apollo/client/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { createApolloClient } from './apollo/client';
import './index.css';
import { createAppRouter } from './router';

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

createRoot(root).render(
  <StrictMode>
    <ApolloProvider client={createApolloClient()}>
      <RouterProvider router={createAppRouter()} />
    </ApolloProvider>
  </StrictMode>,
);
