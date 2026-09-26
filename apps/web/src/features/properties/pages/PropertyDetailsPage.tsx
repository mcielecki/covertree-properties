import { skipToken, useApolloClient, useQuery } from '@apollo/client/react';
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
  const client = useApolloClient();
  const navigate = useNavigate();
  // A malformed id can't exist; don't spend a request on a BAD_USER_INPUT error.
  const { data, loading, error, refetch } = useQuery(
    PROPERTY_QUERY,
    validId ? { variables: { id } } : skipToken,
  );

  function handleDeleted() {
    const { cache } = client;
    // No broadcast: this page is still mounted, and a broadcast would make its query refetch
    // the property that was just deleted.
    cache.evict({ id: cache.identify({ __typename: 'Property', id }), broadcast: false });
    cache.gc();
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
    ['Latitude', String(property.lat)],
    ['Longitude', String(property.long)],
    ['Created', formatCreatedAt(property.createdAt)],
  ];

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-blue-700 underline">
        ← All properties
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{property.street}</h1>
          <p className="text-gray-700">
            {property.city}, {property.state} {property.zipCode}
          </p>
        </div>
        <DeleteButton id={property.id} address={address} onDeleted={handleDeleted} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section
          aria-labelledby="details-heading"
          className="rounded border border-gray-200 bg-white p-4"
        >
          <h2 id="details-heading" className="text-lg font-semibold">
            Details
          </h2>
          <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
            {fields.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-gray-600">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-gray-500">
            Coordinates are those Weatherstack resolved for the zip code, not the street address.
          </p>
        </section>
        <WeatherCard weather={property.weatherData} />
      </div>
    </div>
  );
}

function PropertyNotFound() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Property not found</h1>
      <p className="text-gray-700">It may have been deleted, or the link is wrong.</p>
      <Link to="/" className="text-blue-700 underline">
        Back to all properties
      </Link>
    </div>
  );
}
