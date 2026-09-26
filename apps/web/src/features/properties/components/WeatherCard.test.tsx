import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { propertyDetails } from '../../../test/fixtures';
import { WeatherCard, type WeatherData } from './WeatherCard';

const full = propertyDetails().weatherData;

/** Only the four fields the API guarantees; every optional one is null. */
const minimal: WeatherData = {
  observationTime: '07:05 AM',
  temperature: 61,
  weatherDescriptions: ['Clear '],
  weatherIcons: [],
  feelsLike: null,
  windSpeed: null,
  windDir: null,
  humidity: null,
};

describe('WeatherCard (AC-W.5)', () => {
  it('shows icon, description, °F, feels-like, wind in mph with direction, humidity in % and UTC time', () => {
    const { container } = render(<WeatherCard weather={full} />);

    // Decorative (alt=""): the description is right next to it.
    expect(container.querySelector('img')).toHaveAttribute('src', full.weatherIcons[0]);
    expect(screen.getByText('95°F')).toBeInTheDocument();
    expect(screen.getByText('Partly cloudy')).toBeInTheDocument();
    expect(screen.getByText('Feels like').nextSibling).toHaveTextContent('93°F');
    expect(screen.getByText('Wind').nextSibling).toHaveTextContent('8 mph WSW');
    expect(screen.getByText('Humidity').nextSibling).toHaveTextContent('12%');
    expect(screen.getByText('Observed 12:14 PM UTC')).toBeInTheDocument();
  });

  it('hides optional fields that are null instead of showing "null" or 0', () => {
    const { container } = render(<WeatherCard weather={minimal} />);

    expect(screen.getByText('61°F')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('Observed 07:05 AM UTC')).toBeInTheDocument();
    for (const label of ['Feels like', 'Wind', 'Humidity']) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
    expect(container.querySelector('img')).toBeNull();
    expect(container).not.toHaveTextContent(/null|undefined|\b0%|0 mph/);
  });
});
