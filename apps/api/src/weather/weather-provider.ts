// The weather port. Plain domain types only: adapters depend on this file, never the reverse.

/**
 * Current weather as stored in `weatherData` (Weatherstack `current`, units=f):
 * temperature/feelslike in °F, wind_speed in mph, pressure in mb, precip in inches,
 * visibility in miles. Only the first four fields are guaranteed.
 */
export interface WeatherCurrent {
  /** Time of observation in UTC, e.g. "12:14 PM". */
  observation_time: string;
  temperature: number;
  weather_descriptions: string[];
  weather_icons: string[];
  feelslike?: number;
  weather_code?: number;
  wind_speed?: number;
  wind_degree?: number;
  wind_dir?: string;
  pressure?: number;
  precip?: number;
  humidity?: number;
  cloudcover?: number;
  uv_index?: number;
  visibility?: number;
  is_day?: 'yes' | 'no';
  /** Fields not modelled above (e.g. astro, air_quality) are kept for storage. */
  [key: string]: unknown;
}

export interface WeatherLookup {
  lat: number;
  long: number;
  current: WeatherCurrent;
}

export interface WeatherProvider {
  /** Throws LocationNotFoundError | WeatherUnavailableError. */
  getCurrentByZip(zipCode: string): Promise<WeatherLookup>;
}
