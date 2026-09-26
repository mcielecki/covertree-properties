import { createBrowserRouter, Link, type RouteObject } from 'react-router';
import { App } from './App';
import { LoadingState } from './components/Feedback';

// Each page is its own chunk, loaded by the router before the page renders.
export const routes: RouteObject[] = [
  {
    element: <App />,
    // Shown on the very first load, while the matched page's chunk downloads.
    HydrateFallback: () => <LoadingState />,
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import('./features/properties/pages/PropertyListPage'))
            .PropertyListPage,
        }),
      },
      {
        path: 'properties/new',
        lazy: async () => ({
          Component: (await import('./features/properties/pages/CreatePropertyPage'))
            .CreatePropertyPage,
        }),
      },
      {
        path: 'properties/:id',
        lazy: async () => ({
          Component: (await import('./features/properties/pages/PropertyDetailsPage'))
            .PropertyDetailsPage,
        }),
      },
      { path: '*', element: <PageNotFound /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}

function PageNotFound() {
  return (
    <div className="max-w-prose space-y-3">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-slate">This address doesn’t match any page in the app.</p>
      <Link to="/" className="link">
        Back to all properties
      </Link>
    </div>
  );
}
