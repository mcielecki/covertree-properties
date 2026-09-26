import type { PropertyQuery } from '../../../gql/graphql';
import {
  formatDescriptions,
  formatHumidity,
  formatObservationTime,
  formatTemperature,
  formatWind,
} from '../../../lib/format';

export type WeatherData = NonNullable<PropertyQuery['property']>['weatherData'];

/** Weather at creation time. Optional fields that are null are left out (AC-W.5). */
export function WeatherCard({ weather }: { weather: WeatherData }) {
  const description = formatDescriptions(weather.weatherDescriptions);
  const icon = weather.weatherIcons[0];
  const details: [label: string, value: string | null][] = [
    ['Feels like', weather.feelsLike === null ? null : formatTemperature(weather.feelsLike)],
    ['Wind', formatWind(weather.windSpeed, weather.windDir)],
    ['Humidity', formatHumidity(weather.humidity)],
  ];

  return (
    <section
      aria-labelledby="weather-heading"
      className="rounded border border-gray-200 bg-white p-4"
    >
      <h2 id="weather-heading" className="text-lg font-semibold">
        Weather at creation
      </h2>
      <div className="mt-3 flex items-center gap-4">
        {icon && <img src={icon} alt="" width={64} height={64} className="rounded" />}
        <div>
          <p className="text-3xl font-semibold">{formatTemperature(weather.temperature)}</p>
          {description && <p className="text-gray-700">{description}</p>}
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
        {details
          .filter((detail): detail is [string, string] => detail[1] !== null)
          .map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-gray-600">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
      <p className="mt-3 text-xs text-gray-500">{formatObservationTime(weather.observationTime)}</p>
    </section>
  );
}
