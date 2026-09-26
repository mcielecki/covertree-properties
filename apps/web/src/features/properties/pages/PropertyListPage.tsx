import { useQuery } from '@apollo/client/react';
import { useEffect } from 'react';
import { Link } from 'react-router';
import { ErrorAlert, LoadingState } from '../../../components/Feedback';
import { describeError } from '../../../lib/error-messages';
import { PROPERTIES_QUERY } from '../api/queries';
import { Pagination } from '../components/Pagination';
import { PropertyFilters } from '../components/PropertyFilters';
import { PropertyTable } from '../components/PropertyTable';
import { PAGE_SIZE, usePropertyListParams } from '../hooks/usePropertyListParams';

export function PropertyListPage() {
  const { params, variables, setFilters, setSort, setPage } = usePropertyListParams();
  const { data, loading, error, refetch } = useQuery(PROPERTIES_QUERY, {
    variables,
    // Revalidate on every visit: after creating or deleting on another page the list query is
    // no longer active, so refetchQueries cannot reach it (SPEC §6).
    fetchPolicy: 'cache-and-network',
  });

  const totalCount = data?.properties.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageOutOfRange = data !== undefined && totalCount > 0 && params.page > totalPages;

  // E.g. the last row of the last page was deleted, or a stale ?page= in a bookmark.
  useEffect(() => {
    if (pageOutOfRange) setPage(totalPages, { replace: true });
  }, [pageOutOfRange, totalPages, setPage]);

  const hasFilters = Boolean(params.city || params.state || params.zip);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Properties</h1>
        <button
          type="button"
          onClick={() => setSort(params.sort === 'desc' ? 'asc' : 'desc')}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm"
        >
          Sort: {params.sort === 'desc' ? 'Newest first' : 'Oldest first'}
        </button>
      </div>

      <PropertyFilters
        key={`${params.city ?? ''}|${params.zip ?? ''}`}
        value={params}
        onApply={setFilters}
      />

      {error && !data ? (
        <ErrorAlert error={describeError(error)} onRetry={() => void refetch()} />
      ) : !data || pageOutOfRange ? (
        loading && <LoadingState label="Loading properties…" />
      ) : totalCount === 0 ? (
        <EmptyState filtered={hasFilters} onClearFilters={() => setFilters({})} />
      ) : (
        <>
          <PropertyTable items={data.properties.items} />
          <Pagination page={params.page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function EmptyState({
  filtered,
  onClearFilters,
}: {
  filtered: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="rounded border border-dashed border-gray-300 bg-white p-6 text-center">
      {filtered ? (
        <>
          <p>No properties match these filters.</p>
          <button type="button" onClick={onClearFilters} className="mt-2 text-blue-700 underline">
            Clear filters
          </button>
        </>
      ) : (
        <>
          <p>No properties yet.</p>
          <Link to="/properties/new" className="mt-2 inline-block text-blue-700 underline">
            Add the first property
          </Link>
        </>
      )}
    </div>
  );
}
