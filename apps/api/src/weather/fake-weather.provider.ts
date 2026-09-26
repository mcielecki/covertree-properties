import type { WeatherLookup, WeatherProvider } from './weather-provider.js';

/** Fountain Hills, AZ (85268), units=f. Defined inline because the fake also runs outside tests. */
const DEFAULT_LOOKUP: WeatherLookup = {
  lat: 33.609,
  long: -111.724,
  current: {
    observation_time: '08:54 AM',
    temperature: 88,
    weather_code: 113,
    weather_icons: [
      'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0001_sunny.png',
    ],
    weather_descriptions: ['Sunny'],
    wind_speed: 3,
    wind_degree: 45,
    wind_dir: 'NE',
    pressure: 1009,
    precip: 0,
    humidity: 33,
    cloudcover: 1,
    feelslike: 88,
    uv_index: 7,
    visibility: 6,
    is_day: 'yes',
  },
};

export interface FakeWeatherProviderOptions {
  lookup?: WeatherLookup;
  delayMs?: number;
  /** Holds every call until this many calls have arrived, then releases them together. */
  barrier?: number;
}

/**
 * Deterministic WeatherProvider for tests, E2E and `WEATHER_PROVIDER=fake`.
 * Returns the same lookup for every zip, records calls, and can be told to fail or delay.
 */
export class FakeWeatherProvider implements WeatherProvider {
  readonly calls: string[] = [];
  private readonly lookup: WeatherLookup;
  private readonly delayMs: number;
  private readonly barrier: number;
  private readonly waiting: (() => void)[] = [];
  private error: Error | undefined;

  constructor(options: FakeWeatherProviderOptions = {}) {
    this.lookup = options.lookup ?? DEFAULT_LOOKUP;
    this.delayMs = options.delayMs ?? 0;
    this.barrier = options.barrier ?? 0;
  }

  /** Every following call throws `error` until reset(). */
  failWith(error: Error): void {
    this.error = error;
  }

  /** Clears recorded calls and any configured failure. */
  reset(): void {
    this.calls.length = 0;
    this.error = undefined;
  }

  async getCurrentByZip(zipCode: string): Promise<WeatherLookup> {
    this.calls.push(zipCode);
    if (this.barrier > 0) {
      await new Promise<void>((resolve) => {
        this.waiting.push(resolve);
        if (this.waiting.length >= this.barrier) {
          this.waiting.splice(0).forEach((release) => release());
        }
      });
    }
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
    if (this.error) {
      throw this.error;
    }
    return structuredClone(this.lookup);
  }
}
