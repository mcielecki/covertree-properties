// Display formatting. Units are fixed by the API (units=f): °F, mph, %.

const oneDecimal = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export function formatTemperature(fahrenheit: number): string {
  return `${oneDecimal.format(fahrenheit)}°F`;
}

/** Weatherstack pads descriptions with trailing spaces ("Partly cloudy "). */
export function formatDescriptions(descriptions: readonly string[]): string {
  return descriptions
    .map((description) => description.trim())
    .filter(Boolean)
    .join(', ');
}

/** Weatherstack's `observation_time` is a UTC time of day without a date, e.g. "12:14 PM". */
export function formatObservationTime(observationTime: string): string {
  return `Observed ${observationTime.trim()} UTC`;
}

export function formatWind(speedMph: number | null, direction: string | null): string | null {
  if (speedMph === null) return null;
  return direction
    ? `${oneDecimal.format(speedMph)} mph ${direction}`
    : `${oneDecimal.format(speedMph)} mph`;
}

export function formatHumidity(percent: number | null): string | null {
  return percent === null ? null : `${percent}%`;
}

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/** Local date, e.g. "Sep 26, 2026". */
export function formatCreatedDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

/** Local date and time, e.g. "Sep 26, 2026, 12:14 PM". */
export function formatCreatedAt(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}
