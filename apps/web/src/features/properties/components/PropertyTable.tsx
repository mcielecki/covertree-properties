import { Link } from 'react-router';
import type { PropertiesQuery } from '../../../gql/graphql';
import { formatCreatedDate, formatTemperature } from '../../../lib/format';
import { DeleteButton } from './DeleteButton';

type PropertyRow = PropertiesQuery['properties']['items'][number];

export function PropertyTable({ items }: { items: readonly PropertyRow[] }) {
  return (
    <div className="overflow-x-auto rounded border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-100 text-gray-700">
          <tr>
            <th className="px-3 py-2 font-medium">Street</th>
            <th className="px-3 py-2 font-medium">City</th>
            <th className="px-3 py-2 font-medium">State</th>
            <th className="px-3 py-2 font-medium">Zip code</th>
            <th className="px-3 py-2 font-medium">Temperature</th>
            <th className="px-3 py-2 font-medium">Created</th>
            <th className="px-3 py-2">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((property) => (
            <tr key={property.id} className="border-b border-gray-100 last:border-0">
              <td className="px-3 py-2">
                <Link to={`/properties/${property.id}`} className="text-blue-700 underline">
                  {property.street}
                </Link>
              </td>
              <td className="px-3 py-2">{property.city}</td>
              <td className="px-3 py-2">{property.state}</td>
              <td className="px-3 py-2">{property.zipCode}</td>
              <td className="px-3 py-2">{formatTemperature(property.weatherData.temperature)}</td>
              <td className="px-3 py-2">{formatCreatedDate(property.createdAt)}</td>
              <td className="px-3 py-2 text-right">
                <DeleteButton
                  id={property.id}
                  address={`${property.street}, ${property.city}, ${property.state} ${property.zipCode}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
