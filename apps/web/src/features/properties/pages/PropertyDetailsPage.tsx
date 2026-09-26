import { skipToken, useQuery } from '@apollo/client/react';
import { idSchema } from '@covertree/validation';
import { Link, useNavigate, useParams } from 'react-router';
import { ErrorAlert, LoadingState } from '../../../components/Feedback';
import { describeError } from '../../../lib/error-messages';
import { formatCreatedAt } from '../../../lib/format';
import { PROPERTY_QUERY } from '../api/queries';
import { DeleteButton } from '../components/DeleteButton';
import { WeatherCard } from '../components/WeatherCard';

export function PropertyDetailsPage() {
  const { id = '' } = useParams();
  const validId = idSchema.safeParse(id).success;
  const navigate = useNavigate();
  // A malformed id can't exist; don't spend a request on a BAD_USER_INPUT error.
  const { data, loading, error, refetch } = useQuery(
    PROPERTY_QUERY,
    validId ? { variables: { id } } : skipToken,
  );

  // DeleteButton has already evicted the property from the cache.
  function handleDeleted() {
    void navigate('/', { replace: true });
  }

  if (!validId || data?.property === null) return <PropertyNotFound />;
  if (error && !data) {
    return <ErrorAlert error={describeError(error)} onRetry={() => void refetch()} />;
  }
  if (!data?.property) return loading ? <LoadingState label="Loading property…" /> : null;

  const property = data.property;
  const address = `${property.street}, ${property.city}, ${property.state} ${property.zipCode}`;
  const fields: [label: string, value: string][] = [
    ['Street', property.street],
    ['City', property.city],
    ['State', property.state],
    ['Zip code', property.zipCode],
    ['Created', formatCreatedAt(property.createdAt)],
    ['Latitude', String(property.lat)],
    ['Longitude', String(property.long)],
  ];

  return (
    <div className="space-y-10">
      <BackLink />
      <header className="flex flex-col gap-6 border-b-2 border-canopy pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance break-words sm:text-5xl">
            {property.street}
          </h1>
          <p className="mt-3 text-xl text-slate">
            {property.city}, {property.state}{' '}
            <span className="tabular-nums">{property.zipCode}</span>
          </p>
        </div>
        <DeleteButton
          id={property.id}
          address={address}
          onDeleted={handleDeleted}
          className="sm:items-end"
        />
      </header>
      <div className="grid gap-6 md:grid-cols-[3fr_2fr] md:items-start">
        <section aria-labelledby="details-heading" className="panel p-6">
          <h2 id="details-heading" className="text-lg font-semibold tracking-tight">
            Details
          </h2>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
            {fields.map(([label, value]) => (
              <div key={label} className={label === 'Street' ? 'col-span-2' : ''}>
                <dt className="text-sm text-slate">{label}</dt>
                <dd className="mt-1 font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs text-slate">
            ID <span className="font-mono break-all select-all">{property.id}</span>
          </p>
          <p className="mt-6 border-t border-mist pt-4 text-sm text-slate">
            Coordinates are those Weatherstack resolved for the zip code, not the street address.
          </p>
        </section>
        <WeatherCard weather={property.weatherData} />
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/"
      className="link inline-flex items-center gap-1.5 text-sm no-underline hover:underline"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      All properties
    </Link>
  );
}

function PropertyNotFound() {
  return (
    <div className="max-w-prose space-y-3">
      <h1 className="text-3xl font-semibold tracking-tight">Property not found</h1>
      <p className="text-slate">It may have been deleted, or the link is wrong.</p>
      <Link to="/" className="link">
        Back to all properties
      </Link>
    </div>
  );
}
