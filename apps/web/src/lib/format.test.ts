import { describe, expect, it } from 'vitest';
import {
  formatCreatedAt,
  formatCreatedDate,
  formatDescriptions,
  formatHumidity,
  formatObservationTime,
  formatTemperature,
  formatWind,
} from './format';

describe('weather formatting (AC-W.5)', () => {
  it('formats temperatures in °F', () => {
    expect(formatTemperature(95)).toBe('95°F');
    expect(formatTemperature(-3.25)).toBe('-3.3°F');
  });

  it('trims descriptions (Weatherstack sends trailing spaces) and joins them', () => {
    expect(formatDescriptions(['Partly cloudy ', ' Mist'])).toBe('Partly cloudy, Mist');
    expect(formatDescriptions(['  ', 'Sunny'])).toBe('Sunny');
    expect(formatDescriptions([])).toBe('');
  });

  it('labels the observation time as UTC', () => {
    expect(formatObservationTime('12:14 PM')).toBe('Observed 12:14 PM UTC');
    expect(formatObservationTime(' 12:14 PM ')).toBe('Observed 12:14 PM UTC');
  });

  it('formats wind in mph with the direction when known', () => {
    expect(formatWind(8, 'WSW')).toBe('8 mph WSW');
    expect(formatWind(0, null)).toBe('0 mph');
    expect(formatWind(null, 'WSW')).toBeNull();
  });

  it('formats humidity in %, and null stays null (never "0%")', () => {
    expect(formatHumidity(12)).toBe('12%');
    expect(formatHumidity(0)).toBe('0%');
    expect(formatHumidity(null)).toBeNull();
  });
});

describe('date formatting', () => {
  it('shows the created date for the list', () => {
    expect(formatCreatedDate('2026-09-26T12:14:00.000Z')).toBe('Sep 26, 2026');
  });

  it('shows the created date and time for the details page', () => {
    // ICU may put a narrow no-break space before "PM"; \s matches it.
    expect(formatCreatedAt('2026-09-26T12:14:00.000Z')).toMatch(/^Sep 26, 2026, 12:14\sPM$/);
  });
});
