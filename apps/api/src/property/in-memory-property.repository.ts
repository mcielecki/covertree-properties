import { randomUUID } from 'node:crypto';
import { AlreadyExistsError, NotFoundError } from '../errors/domain-errors.js';
import type { PropertyRepository } from './property.repository.js';
import type {
  ListParams,
  NewPropertyData,
  PropertyPage,
  PropertyRecord,
} from './property.types.js';

/** Key columns sit beside the record, as in the Prisma table, and never leave this class. */
interface StoredProperty {
  record: PropertyRecord;
  cityKey: string;
  addressKey: string;
}

export interface InMemoryPropertyRepositoryOptions {
  /** Source of `createdAt`. Tests pass a fixed clock to create identical timestamps. */
  clock?: () => Date;
}

/**
 * PropertyRepository for unit tests. Mirrors the Prisma repository, including the unique
 * `addressKey` constraint and the (createdAt, id) ordering. Returns copies, like a database would.
 */
export class InMemoryPropertyRepository implements PropertyRepository {
  private readonly rows = new Map<string, StoredProperty>();
  private readonly clock: () => Date;

  constructor(options: InMemoryPropertyRepositoryOptions = {}) {
    this.clock = options.clock ?? (() => new Date());
  }

  list({ filter, sortOrder, limit, offset }: ListParams): Promise<PropertyPage> {
    const direction = sortOrder === 'ASC' ? 1 : -1;
    const matching = [...this.rows.values()]
      .filter(
        (row) =>
          (filter.cityKey === undefined || row.cityKey === filter.cityKey) &&
          (filter.zipCode === undefined || row.record.zipCode === filter.zipCode) &&
          (filter.state === undefined || row.record.state === filter.state),
      )
      .map((row) => row.record)
      .sort(
        (a, b) =>
          direction * (a.createdAt.getTime() - b.createdAt.getTime() || compareStrings(a.id, b.id)),
      );
    return Promise.resolve({
      items: matching.slice(offset, offset + limit).map((record) => structuredClone(record)),
      totalCount: matching.length,
    });
  }

  findById(id: string): Promise<PropertyRecord | null> {
    const row = this.rows.get(id);
    return Promise.resolve(row ? structuredClone(row.record) : null);
  }

  findIdByAddressKey(addressKey: string): Promise<string | null> {
    const row = [...this.rows.values()].find((r) => r.addressKey === addressKey);
    return Promise.resolve(row?.record.id ?? null);
  }

  create(data: NewPropertyData): Promise<PropertyRecord> {
    if ([...this.rows.values()].some((r) => r.addressKey === data.addressKey)) {
      // Like the unique-constraint path in Prisma: the existing id is not reported.
      return Promise.reject(new AlreadyExistsError());
    }
    const { cityKey, addressKey, ...fields } = structuredClone(data);
    const record: PropertyRecord = { ...fields, id: randomUUID(), createdAt: this.clock() };
    this.rows.set(record.id, { record, cityKey, addressKey });
    return Promise.resolve(structuredClone(record));
  }

  delete(id: string): Promise<void> {
    if (!this.rows.delete(id)) {
      return Promise.reject(new NotFoundError(id));
    }
    return Promise.resolve();
  }
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
