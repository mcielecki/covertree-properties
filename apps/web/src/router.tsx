import { createBrowserRouter, Link, type RouteObject } from 'react-router';
import { App } from './App';
import { CreatePropertyPage } from './features/properties/pages/CreatePropertyPage';
import { PropertyDetailsPage } from './features/properties/pages/PropertyDetailsPage';
import { PropertyListPage } from './features/properties/pages/PropertyListPage';

export const routes: RouteObject[] = [
  {
    element: <App />,
    children: [
      { index: true, element: <PropertyListPage /> },
      { path: 'properties/new', element: <CreatePropertyPage /> },
      { path: 'properties/:id', element: <PropertyDetailsPage /> },
      { path: '*', element: <PageNotFound /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}

function PageNotFound() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link to="/" className="text-blue-700 underline">
        Back to all properties
      </Link>
    </div>
  );
}
