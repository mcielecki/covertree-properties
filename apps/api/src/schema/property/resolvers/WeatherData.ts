import type { WeatherDataResolvers } from './../../types.generated.js';

// The parent is the stored Weatherstack `current` object (snake_case). Pure field mapping:
// optional fields Weatherstack omitted (or the adapter dropped) resolve to null (AC-5.14).
export const WeatherData: WeatherDataResolvers = {
  observationTime: (parent) => parent.observation_time,
  weatherDescriptions: (parent) => parent.weather_descriptions,
  weatherIcons: (parent) => parent.weather_icons,
  feelsLike: (parent) => parent.feelslike ?? null,
  weatherCode: (parent) => parent.weather_code ?? null,
  windSpeed: (parent) => parent.wind_speed ?? null,
  windDegree: (parent) => parent.wind_degree ?? null,
  windDir: (parent) => parent.wind_dir ?? null,
  pressure: (parent) => parent.pressure ?? null,
  precip: (parent) => parent.precip ?? null,
  humidity: (parent) => parent.humidity ?? null,
  cloudCover: (parent) => parent.cloudcover ?? null,
  uvIndex: (parent) => parent.uv_index ?? null,
  visibility: (parent) => parent.visibility ?? null,
  isDay: (parent) => (parent.is_day === undefined ? null : parent.is_day === 'yes'),
};
