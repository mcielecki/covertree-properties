import { Link } from 'react-router';
import type { PropertiesQuery } from '../../../gql/graphql';
import { formatCreatedDate, formatTemperature } from '../../../lib/format';
import { DeleteButton } from './DeleteButton';

type PropertyRow = PropertiesQuery['properties']['items'][number];

/**
 * A table on wide screens; below `md` each row is laid out as a card by `.property-table` in
 * index.css. The explicit roles keep table semantics when CSS changes the `display` values.
 */
export function PropertyTable({ items }: { items: readonly PropertyRow[] }) {
  return (
    <div className="panel overflow-hidden">
      <table role="table" className="property-table w-full text-left">
        <caption className="sr-only">Properties</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th role="columnheader" scope="col">
              Street
            </th>
            <th role="columnheader" scope="col">
              City
            </th>
            <th role="columnheader" scope="col">
              State
            </th>
            <th role="columnheader" scope="col">
              Zip code
            </th>
            <th role="columnheader" scope="col" className="text-right">
              Temperature
            </th>
            <th role="columnheader" scope="col">
              Created
            </th>
            <th role="columnheader" scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {items.map((property) => (
            <tr role="row" key={property.id}>
              <td role="cell" data-cell="street">
                <Link to={`/properties/${property.id}`} className="link">
                  {property.street}
                </Link>
              </td>
              <td role="cell" data-cell="city">
                {property.city}
              </td>
              <td role="cell" data-cell="state">
                {property.state}
              </td>
              <td role="cell" data-cell="zip" className="tabular-nums">
                {property.zipCode}
              </td>
              <td role="cell" data-cell="temperature" className="text-right tabular-nums">
                {formatTemperature(property.weatherData.temperature)}
              </td>
              <td role="cell" data-cell="created" className="tabular-nums">
                {formatCreatedDate(property.createdAt)}
              </td>
              <td role="cell" data-cell="actions">
                <DeleteButton
                  id={property.id}
                  address={`${property.street}, ${property.city}, ${property.state} ${property.zipCode}`}
                  className="md:items-end"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
