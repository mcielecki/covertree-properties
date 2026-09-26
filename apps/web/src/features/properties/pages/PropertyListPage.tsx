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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Properties</h1>
          <p className="mt-2 text-slate tabular-nums" aria-live="polite">
            {data && totalCount > 0 ? countLabel(totalCount, hasFilters) : '\u00a0'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSort(params.sort === 'desc' ? 'asc' : 'desc')}
          className="btn btn-secondary"
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

function countLabel(count: number, filtered: boolean) {
  if (!filtered) return count === 1 ? '1 property' : `${count} properties`;
  return count === 1
    ? '1 property matches these filters'
    : `${count} properties match these filters`;
}

function EmptyState({
  filtered,
  onClearFilters,
}: {
  filtered: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="panel flex flex-col items-start gap-4 border-dashed px-6 py-12 sm:items-center sm:text-center">
      {filtered ? (
        <>
          <p className="text-lg font-semibold">No properties match these filters.</p>
          <button type="button" onClick={onClearFilters} className="btn btn-secondary">
            Clear filters
          </button>
        </>
      ) : (
        <>
          <div>
            <p className="text-lg font-semibold">No properties yet.</p>
            <p className="mt-1 text-slate">
              Add an address and its current weather is recorded with it.
            </p>
          </div>
          <Link to="/properties/new" className="btn btn-primary">
            Add the first property
          </Link>
        </>
      )}
    </div>
  );
}
