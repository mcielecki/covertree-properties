import { describe, expect, it } from 'vitest';
import { LocationNotFoundError } from '../errors/domain-errors.js';
import { FakeWeatherProvider } from './fake-weather.provider.js';

describe('FakeWeatherProvider', () => {
  it('returns a deterministic lookup for any zip code', async () => {
    const fake = new FakeWeatherProvider();

    const a = await fake.getCurrentByZip('85268');
    const b = await fake.getCurrentByZip('10001');

    expect(a).toEqual(b);
    expect(a.lat).toBeTypeOf('number');
    expect(a.long).toBeTypeOf('number');
    expect(a.current.observation_time).toBeTypeOf('string');
    expect(a.current.temperature).toBeTypeOf('number');
    expect(a.current.weather_descriptions.length).toBeGreaterThan(0);
    expect(a.current.weather_icons.length).toBeGreaterThan(0);
  });

  it('returns a copy, so callers cannot mutate the next result', async () => {
    const fake = new FakeWeatherProvider();

    const first = await fake.getCurrentByZip('85268');
    first.current.temperature = -1;

    expect((await fake.getCurrentByZip('85268')).current.temperature).not.toBe(-1);
  });

  it('records every zip code it was asked for', async () => {
    const fake = new FakeWeatherProvider();

    await fake.getCurrentByZip('85268');
    await fake.getCurrentByZip('02134');

    expect(fake.calls).toEqual(['85268', '02134']);
  });

  it('can be configured with a custom lookup', async () => {
    const fake = new FakeWeatherProvider({
      lookup: {
        lat: 1,
        long: 2,
        current: {
          observation_time: '01:00 PM',
          temperature: 50,
          weather_descriptions: ['Rain'],
          weather_icons: [],
        },
      },
    });

    await expect(fake.getCurrentByZip('85268')).resolves.toMatchObject({ lat: 1, long: 2 });
  });

  it('throws the configured error and still records the call', async () => {
    const fake = new FakeWeatherProvider();
    fake.failWith(new LocationNotFoundError('00000', 'test'));

    await expect(fake.getCurrentByZip('00000')).rejects.toBeInstanceOf(LocationNotFoundError);
    expect(fake.calls).toEqual(['00000']);
  });

  it('succeeds again after reset()', async () => {
    const fake = new FakeWeatherProvider();
    fake.failWith(new LocationNotFoundError('00000', 'test'));
    await fake.getCurrentByZip('00000').catch(() => undefined);

    fake.reset();

    await expect(fake.getCurrentByZip('85268')).resolves.toBeDefined();
    expect(fake.calls).toEqual(['85268']);
  });

  it('with a barrier, holds every call until that many calls have arrived', async () => {
    const fake = new FakeWeatherProvider({ barrier: 2 });
    let firstSettled = false;

    const first = fake.getCurrentByZip('85268').finally(() => {
      firstSettled = true;
    });
    // Let any already-resolved promise settle before checking that the first call is still held.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(firstSettled).toBe(false);

    const second = fake.getCurrentByZip('85268');

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(fake.calls).toEqual(['85268', '85268']);
  });

  it('waits for the configured delay before answering', async () => {
    const fake = new FakeWeatherProvider({ delayMs: 30 });

    const started = Date.now();
    await fake.getCurrentByZip('85268');

    expect(Date.now() - started).toBeGreaterThanOrEqual(25);
  });
});
