// Shared behavior of every PropertyRepository. Runs against the in-memory fake (unit) and the
// Prisma repository (integration), so the fake used by service tests cannot drift from the real one.
import type { USState } from '@covertree/validation';
import { beforeEach, describe, expect, it } from 'vitest';
import { AlreadyExistsError, NotFoundError } from '../errors/domain-errors.js';
import { toAddressKey, toCityKey } from './keys.js';
import type { PropertyRepository } from './property.repository.js';
import type { ListParams, NewPropertyData, PropertyRecord } from './property.types.js';

export interface RepositoryHarness {
  repo: PropertyRepository;
  /** Stores a property with a fixed `createdAt`, so ordering tests do not depend on the clock. */
  insertAt: (data: NewPropertyData, createdAt: Date) => Promise<PropertyRecord>;
}

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface AddressOverrides {
  street?: string;
  city?: string;
  state?: USState;
  zipCode?: string;
}

export function buildNewProperty(overrides: AddressOverrides = {}): NewPropertyData {
  const address = {
    street: overrides.street ?? '15528 E Golden Eagle Blvd',
    city: overrides.city ?? 'Fountain Hills',
    state: overrides.state ?? 'AZ',
    zipCode: overrides.zipCode ?? '85268',
  };
  return {
    ...address,
    cityKey: toCityKey(address.city),
    addressKey: toAddressKey(address),
    lat: 33.609,
    long: -111.724,
    weatherData: {
      observation_time: '08:54 AM',
      temperature: 88,
      weather_descriptions: ['Sunny'],
      weather_icons: ['https://example.com/sunny.png'],
      is_day: 'yes',
      astro: { sunrise: '05:40 AM' },
    },
  };
}

function listParams(overrides: Partial<ListParams> = {}): ListParams {
  return { filter: {}, sortOrder: 'DESC', limit: 20, offset: 0, ...overrides };
}

const at = (second: number) => new Date(Date.UTC(2026, 0, 1, 12, 0, second));

export function describePropertyRepositoryContract(
  label: string,
  setup: () => RepositoryHarness | Promise<RepositoryHarness>,
): void {
  describe(`PropertyRepository contract: ${label}`, () => {
    let repo: PropertyRepository;
    let insertAt: RepositoryHarness['insertAt'];

    beforeEach(async () => {
      ({ repo, insertAt } = await setup());
    });

    describe('create / findById', () => {
      it('AC-7.2: generates a UUID id and createdAt, and returns the stored fields', async () => {
        const data = buildNewProperty();
        const before = Date.now();
        const created = await repo.create(data);

        expect(created.id).toMatch(UUID);
        expect(created.createdAt).toBeInstanceOf(Date);
        expect(created.createdAt.getTime()).toBeGreaterThanOrEqual(before - 5_000);
        expect(created.createdAt.getTime()).toBeLessThanOrEqual(Date.now() + 5_000);
        // Exactly the visible fields: the key columns stay inside the repository.
        expect(created).toEqual({
          id: created.id,
          street: data.street,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          lat: data.lat,
          long: data.long,
          weatherData: data.weatherData,
          createdAt: created.createdAt,
        });
      });

      it('AC-4.1, AC-4.5: findById returns the record as stored, weather extras included', async () => {
        const created = await repo.create(buildNewProperty());

        expect(await repo.findById(created.id)).toEqual(created);
      });

      it('AC-4.2: findById returns null for an unknown id', async () => {
        expect(await repo.findById(UNKNOWN_ID)).toBeNull();
      });

      it('AC-5.12: rejects a second property with the same addressKey', async () => {
        await repo.create(buildNewProperty());

        await expect(repo.create(buildNewProperty())).rejects.toBeInstanceOf(AlreadyExistsError);
      });

      it('AC-5.12: of two concurrent creates with the same addressKey, exactly one succeeds', async () => {
        const results = await Promise.allSettled([
          repo.create(buildNewProperty()),
          repo.create(buildNewProperty()),
        ]);

        expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
        const rejected = results.filter((r) => r.status === 'rejected');
        expect(rejected).toHaveLength(1);
        expect(rejected[0]?.reason).toBeInstanceOf(AlreadyExistsError);
      });
    });

    describe('findIdByAddressKey', () => {
      it('returns the id of the property with that key', async () => {
        const created = await repo.create(buildNewProperty());

        expect(await repo.findIdByAddressKey(buildNewProperty().addressKey)).toBe(created.id);
      });

      it('returns null when no property has that key', async () => {
        expect(await repo.findIdByAddressKey('nothing|here|az|00000')).toBeNull();
      });
    });

    describe('delete', () => {
      it('AC-6.1: removes the property', async () => {
        const created = await repo.create(buildNewProperty());

        await repo.delete(created.id);

        expect(await repo.findById(created.id)).toBeNull();
      });

      it('AC-6.2: throws NotFoundError for an unknown id', async () => {
        await expect(repo.delete(UNKNOWN_ID)).rejects.toBeInstanceOf(NotFoundError);
      });

      it('AC-6.4: frees the address for a new property', async () => {
        const created = await repo.create(buildNewProperty());
        await repo.delete(created.id);

        await expect(repo.create(buildNewProperty())).resolves.toMatchObject({
          city: 'Fountain Hills',
        });
      });
    });

    describe('list', () => {
      it('AC-1.1: returns an empty page when there are no properties', async () => {
        expect(await repo.list(listParams())).toEqual({ items: [], totalCount: 0 });
      });

      it('AC-2.1, AC-2.2: sorts by createdAt, DESC and ASC', async () => {
        const a = await insertAt(buildNewProperty({ street: '1 A St' }), at(1));
        const b = await insertAt(buildNewProperty({ street: '2 B St' }), at(2));
        const c = await insertAt(buildNewProperty({ street: '3 C St' }), at(3));

        const desc = await repo.list(listParams({ sortOrder: 'DESC' }));
        const asc = await repo.list(listParams({ sortOrder: 'ASC' }));

        expect(desc.items.map((p) => p.id)).toEqual([c.id, b.id, a.id]);
        expect(asc.items.map((p) => p.id)).toEqual([a.id, b.id, c.id]);
      });

      it('AC-2.3: breaks createdAt ties on id, in the same direction', async () => {
        const tied = [
          await insertAt(buildNewProperty({ street: '1 A St' }), at(1)),
          await insertAt(buildNewProperty({ street: '2 B St' }), at(1)),
          await insertAt(buildNewProperty({ street: '3 C St' }), at(1)),
        ];
        const idsAsc = tied.map((p) => p.id).sort();

        const asc = await repo.list(listParams({ sortOrder: 'ASC' }));
        const desc = await repo.list(listParams({ sortOrder: 'DESC' }));

        expect(asc.items.map((p) => p.id)).toEqual(idsAsc);
        expect(desc.items.map((p) => p.id)).toEqual([...idsAsc].reverse());
      });

      it('AC-1.3, AC-1.4: applies limit and offset; totalCount ignores them', async () => {
        for (let i = 0; i < 5; i++) {
          await insertAt(buildNewProperty({ street: `${i} Main St` }), at(i));
        }

        const page = await repo.list(listParams({ sortOrder: 'ASC', limit: 2, offset: 3 }));

        expect(page.items.map((p) => p.street)).toEqual(['3 Main St', '4 Main St']);
        expect(page.totalCount).toBe(5);
      });

      it('AC-3.1, AC-3.2: filters the city by exact cityKey equality', async () => {
        await repo.create(buildNewProperty({ city: 'Fountain Hills' }));
        await repo.create(buildNewProperty({ city: 'Phoenix' }));

        const exact = await repo.list(listParams({ filter: { cityKey: 'fountain hills' } }));
        const partial = await repo.list(listParams({ filter: { cityKey: 'fountain' } }));

        expect(exact.items.map((p) => p.city)).toEqual(['Fountain Hills']);
        expect(partial).toEqual({ items: [], totalCount: 0 });
      });

      it('AC-3.4, AC-3.5: filters by zip code and by state', async () => {
        await repo.create(buildNewProperty({ zipCode: '85268', state: 'AZ' }));
        await repo.create(buildNewProperty({ zipCode: '85001', state: 'AZ' }));
        await repo.create(buildNewProperty({ zipCode: '90210', state: 'CA' }));

        const byZip = await repo.list(listParams({ filter: { zipCode: '85268' } }));
        const byState = await repo.list(listParams({ filter: { state: 'AZ' } }));

        expect(byZip.items.map((p) => p.zipCode)).toEqual(['85268']);
        expect(byState.items.map((p) => p.zipCode).sort()).toEqual(['85001', '85268']);
      });

      it('AC-3.6, AC-2.4: combines filter fields with AND; totalCount is the filtered size', async () => {
        await insertAt(buildNewProperty({ city: 'Phoenix', state: 'AZ', street: '1 A St' }), at(1));
        await insertAt(buildNewProperty({ city: 'Phoenix', state: 'AZ', street: '2 B St' }), at(2));
        await insertAt(buildNewProperty({ city: 'Phoenix', state: 'AZ', street: '3 C St' }), at(3));
        await insertAt(buildNewProperty({ city: 'Phoenix', state: 'NY', street: '4 D St' }), at(4));
        await insertAt(buildNewProperty({ city: 'Tempe', state: 'AZ', street: '5 E St' }), at(5));

        const page = await repo.list(
          listParams({ filter: { cityKey: 'phoenix', state: 'AZ' }, sortOrder: 'DESC', limit: 2 }),
        );

        expect(page.items.map((p) => p.street)).toEqual(['3 C St', '2 B St']);
        expect(page.totalCount).toBe(3);
      });
    });
  });
}
