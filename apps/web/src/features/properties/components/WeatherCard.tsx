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
  const shown = details.filter((detail): detail is [string, string] => detail[1] !== null);

  return (
    <section aria-labelledby="weather-heading" className="panel p-6">
      <h2 id="weather-heading" className="text-lg font-semibold tracking-tight">
        Weather at creation
      </h2>
      <div className="mt-5 flex items-center gap-5">
        {icon && <img src={icon} alt="" width={56} height={56} className="size-14 rounded-md" />}
        <div>
          <p className="text-5xl leading-none font-semibold tracking-tight tabular-nums">
            {formatTemperature(weather.temperature)}
          </p>
          {description && <p className="mt-2 text-slate">{description}</p>}
        </div>
      </div>
      {shown.length > 0 && (
        <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-mist pt-5">
          {shown.map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-slate">{label}</dt>
              <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-5 text-sm text-slate">{formatObservationTime(weather.observationTime)}</p>
    </section>
  );
}
