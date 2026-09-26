import { Link, NavLink, Outlet, useNavigation } from 'react-router';

/** Root layout: header and the current page. */
export function App() {
  // Lazy route modules load before the next page renders; show that something is happening.
  const navigating = useNavigation().state === 'loading';

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <header className="border-b border-mist bg-white">
        <div
          aria-hidden="true"
          className={`h-0.5 bg-canopy transition-opacity ${navigating ? 'opacity-100' : 'opacity-0'}`}
        />
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6"
        >
          <Link to="/" className="text-lg leading-none tracking-tight">
            <span className="font-bold text-pine">Covertree</span>{' '}
            <span className="font-normal text-slate">Properties</span>
          </Link>
          <NavLink to="/properties/new" className="btn btn-primary">
            Add property
          </NavLink>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>
    </div>
  );
}
