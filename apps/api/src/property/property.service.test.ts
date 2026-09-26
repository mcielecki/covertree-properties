import type { CreatePropertyInput, USState } from '@covertree/validation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AlreadyExistsError,
  LocationNotFoundError,
  NotFoundError,
  ValidationError,
  WeatherUnavailableError,
} from '../errors/domain-errors.js';
import { FakeWeatherProvider } from '../weather/fake-weather.provider.js';
import type { WeatherLookup } from '../weather/weather-provider.js';
import { InMemoryPropertyRepository } from './in-memory-property.repository.js';
import { PropertyService } from './property.service.js';

const VALID_INPUT: CreatePropertyInput = {
  street: '15528 E Golden Eagle Blvd',
  city: 'Fountain Hills',
  state: 'AZ',
  zipCode: '85268',
};

const LOOKUP: WeatherLookup = {
  lat: 33.609,
  long: -111.729,
  current: {
    observation_time: '12:14 PM',
    temperature: 95,
    weather_descriptions: ['Sunny'],
    weather_icons: ['https://example.com/sunny.png'],
    humidity: 12,
    astro: { sunrise: '05:40 AM' },
  },
};

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

let repo: InMemoryPropertyRepository;
let weather: FakeWeatherProvider;
let service: PropertyService;

beforeEach(() => {
  repo = new InMemoryPropertyRepository();
  weather = new FakeWeatherProvider({ lookup: LOOKUP });
  service = new PropertyService(repo, weather);
});

async function expectValidationError(promise: Promise<unknown>, field: string): Promise<void> {
  const error: unknown = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ValidationError);
  expect((error as ValidationError).fieldErrors).toEqual({ [field]: [expect.any(String)] });
}

async function storedCount(): Promise<number> {
  return (await service.list()).totalCount;
}

describe('PropertyService.list', () => {
  it('AC-1.1: returns an empty page when there are no properties', async () => {
    expect(await service.list()).toEqual({ items: [], totalCount: 0 });
  });

  it('AC-1.2, AC-1.3, AC-2.1: defaults to limit 20, offset 0, DESC and no filter', async () => {
    const list = vi.spyOn(repo, 'list');

    await service.list();

    expect(list).toHaveBeenCalledWith({ filter: {}, sortOrder: 'DESC', limit: 20, offset: 0 });
  });

  it('applies the defaults when arguments are explicitly null', async () => {
    const list = vi.spyOn(repo, 'list');

    await service.list({ filter: null, sortOrder: null, limit: null, offset: null });

    expect(list).toHaveBeenCalledWith({ filter: {}, sortOrder: 'DESC', limit: 20, offset: 0 });
  });

  it('AC-1.4, AC-2.2, AC-2.4: passes filter, sort order and pagination together', async () => {
    const list = vi.spyOn(repo, 'list');

    await service.list({
      filter: { city: 'Phoenix', zipCode: '85001', state: 'AZ' },
      sortOrder: 'ASC',
      limit: 10,
      offset: 20,
    });

    expect(list).toHaveBeenCalledWith({
      filter: { cityKey: 'phoenix', zipCode: '85001', state: 'AZ' },
      sortOrder: 'ASC',
      limit: 10,
      offset: 20,
    });
  });

  it('AC-1.3: returns the repository page and totalCount', async () => {
    for (let i = 0; i < 25; i++) {
      await service.create({ ...VALID_INPUT, street: `${i} Main St` });
    }

    const page = await service.list();

    expect(page.items).toHaveLength(20);
    expect(page.totalCount).toBe(25);
  });

  it.each([
    ['limit', { limit: 0 }],
    ['limit', { limit: 101 }],
    ['offset', { offset: -1 }],
  ])('AC-1.5: rejects an out-of-range %s without querying', async (field, args) => {
    const list = vi.spyOn(repo, 'list');

    await expectValidationError(service.list(args), field);
    expect(list).not.toHaveBeenCalled();
  });

  it.each(['fountain hills', '  Fountain   Hills ', 'FOUNTAIN HILLS'])(
    'AC-3.1, AC-3.3: filters the city %j by its cityKey',
    async (city) => {
      const list = vi.spyOn(repo, 'list');

      await service.list({ filter: { city } });

      expect(list).toHaveBeenCalledWith(
        expect.objectContaining({ filter: { cityKey: 'fountain hills' } }),
      );
    },
  );

  it('AC-3.1, AC-3.2: returns only exact city matches', async () => {
    await service.create(VALID_INPUT);
    await service.create({
      ...VALID_INPUT,
      street: '1 Main St',
      city: 'Phoenix',
      zipCode: '85001',
    });

    const exact = await service.list({ filter: { city: 'fountain hills' } });
    const partial = await service.list({ filter: { city: 'Fountain' } });

    expect(exact.items.map((p) => p.city)).toEqual(['Fountain Hills']);
    expect(partial.totalCount).toBe(0);
  });

  it('AC-3.9: leaves out null filter fields', async () => {
    const list = vi.spyOn(repo, 'list');

    await service.list({ filter: { city: null, zipCode: '85268', state: null } });

    expect(list).toHaveBeenCalledWith(expect.objectContaining({ filter: { zipCode: '85268' } }));
  });

  it.each([
    ['zipCode', { zipCode: '852' }],
    ['city', { city: '   ' }],
    ['city', { city: 'Phoenix1' }],
  ])('AC-3.7: rejects an invalid %s filter', async (field, filter) => {
    await expectValidationError(service.list({ filter }), field);
  });

  it('AC-3.8 (defense in depth): rejects a state outside USState', async () => {
    await expectValidationError(service.list({ filter: { state: 'XX' as USState } }), 'state');
  });

  it('AC-1.6: never calls the weather provider', async () => {
    await service.create(VALID_INPUT);
    weather.reset();

    await service.list();
    await service.list({ filter: { city: 'Fountain Hills' } });

    expect(weather.calls).toEqual([]);
  });
});

describe('PropertyService.getById', () => {
  it('AC-4.1: returns the stored property', async () => {
    const created = await service.create(VALID_INPUT);

    expect(await service.getById(created.id)).toEqual(created);
  });

  it('AC-4.2: returns null for an unknown well-formed id', async () => {
    expect(await service.getById(UNKNOWN_ID)).toBeNull();
  });

  it('AC-4.3: rejects an id that is not a UUID', async () => {
    await expectValidationError(service.getById('not-a-uuid'), 'id');
  });

  it('AC-4.4, AC-4.5: never calls the weather provider and returns the weather stored at creation', async () => {
    const created = await service.create(VALID_INPUT);
    weather.reset();

    const found = await service.getById(created.id);

    expect(weather.calls).toEqual([]);
    expect(found?.weatherData).toEqual(LOOKUP.current);
  });
});

describe('PropertyService.create', () => {
  it('AC-5.1: persists and returns the property with coordinates and weather from the lookup', async () => {
    const before = Date.now();

    const created = await service.create(VALID_INPUT);

    expect(created).toEqual({
      ...VALID_INPUT,
      id: created.id,
      lat: LOOKUP.lat,
      long: LOOKUP.long,
      weatherData: LOOKUP.current,
      createdAt: created.createdAt,
    });
    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.createdAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(await service.getById(created.id)).toEqual(created);
  });

  it('AC-5.2: calls the weather provider exactly once, with the zip code', async () => {
    await service.create(VALID_INPUT);

    expect(weather.calls).toEqual(['85268']);
  });

  it('AC-5.6: stores normalized street and city, keeping their casing', async () => {
    const created = await service.create({
      ...VALID_INPUT,
      street: '  15528  E Golden Eagle Blvd ',
      city: ' Fountain  Hills',
    });

    expect(created.street).toBe('15528 E Golden Eagle Blvd');
    expect(created.city).toBe('Fountain Hills');
  });

  it.each(['8526', '852680', '8526a', '85268-1234'])(
    'AC-5.3: rejects zip code %j without calling weather or persisting',
    async (zipCode) => {
      await expectValidationError(service.create({ ...VALID_INPUT, zipCode }), 'zipCode');
      expect(weather.calls).toEqual([]);
      expect(await storedCount()).toBe(0);
    },
  );

  it.each([
    ['street', ''],
    ['street', '   '],
    ['street', 'a'.repeat(201)],
    ['city', ''],
    ['city', ' \t '],
    ['city', 'a'.repeat(101)],
  ])('AC-5.4: rejects %s %j without calling weather or persisting', async (field, value) => {
    await expectValidationError(service.create({ ...VALID_INPUT, [field]: value }), field);
    expect(weather.calls).toEqual([]);
    expect(await storedCount()).toBe(0);
  });

  it('AC-5.4: accepts street and city at their maximum lengths', async () => {
    await expect(
      service.create({ ...VALID_INPUT, street: 'a'.repeat(200), city: 'a'.repeat(100) }),
    ).resolves.toBeDefined();
  });

  it('AC-5.5 (defense in depth): rejects a state outside USState without calling weather', async () => {
    await expectValidationError(
      service.create({ ...VALID_INPUT, state: 'XX' as USState }),
      'state',
    );
    expect(weather.calls).toEqual([]);
  });

  it('reports every invalid field at once', async () => {
    const error: unknown = await service
      .create({ street: '', city: '', state: 'AZ', zipCode: '1' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ValidationError);
    expect(Object.keys((error as ValidationError).fieldErrors).sort()).toEqual([
      'city',
      'street',
      'zipCode',
    ]);
  });

  it('AC-5.7: rejects a duplicate address (case and whitespace insensitive) before calling weather', async () => {
    const existing = await service.create(VALID_INPUT);
    weather.reset();

    const error: unknown = await service
      .create({ ...VALID_INPUT, street: '15528 e GOLDEN eagle  blvd', city: 'fountain hills' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AlreadyExistsError);
    expect((error as AlreadyExistsError).id).toBe(existing.id);
    expect(weather.calls).toEqual([]);
    expect(await storedCount()).toBe(1);
  });

  it.each([
    ['AC-5.8, AC-5.9', new LocationNotFoundError('85268', 'error 615')],
    ['AC-5.10, AC-5.11', new WeatherUnavailableError('timeout')],
  ])('%s: propagates the weather error and persists nothing', async (_ac, weatherError) => {
    weather.failWith(weatherError);

    await expect(service.create(VALID_INPUT)).rejects.toBe(weatherError);
    expect(await storedCount()).toBe(0);
  });

  it('AC-5.12: of two concurrent creates of the same address, exactly one succeeds', async () => {
    const results = await Promise.allSettled([
      service.create(VALID_INPUT),
      service.create(VALID_INPUT),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((r) => r.status === 'rejected');
    expect(rejected?.reason).toBeInstanceOf(AlreadyExistsError);
    expect(await storedCount()).toBe(1);
  });

  it('AC-7.2, AC-7.3: ignores client-supplied id, createdAt, lat and long', async () => {
    const input = {
      ...VALID_INPUT,
      id: UNKNOWN_ID,
      createdAt: new Date(0),
      lat: 1,
      long: 2,
    } as CreatePropertyInput;

    const created = await service.create(input);

    expect(created.id).not.toBe(UNKNOWN_ID);
    expect(created.createdAt.getTime()).not.toBe(0);
    expect(created.lat).toBe(LOOKUP.lat);
    expect(created.long).toBe(LOOKUP.long);
  });
});

describe('PropertyService.delete', () => {
  it('AC-6.1: deletes the property and returns its id', async () => {
    const created = await service.create(VALID_INPUT);

    expect(await service.delete(created.id)).toBe(created.id);
    expect(await service.getById(created.id)).toBeNull();
  });

  it('AC-6.2: throws NotFoundError for an unknown well-formed id', async () => {
    await expect(service.delete(UNKNOWN_ID)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('AC-6.3: rejects a malformed id', async () => {
    await expectValidationError(service.delete('123'), 'id');
  });

  it('AC-6.4: allows the same address to be created again after a delete', async () => {
    const created = await service.create(VALID_INPUT);
    await service.delete(created.id);

    await expect(service.create(VALID_INPUT)).resolves.toMatchObject({
      street: VALID_INPUT.street,
    });
  });
});
