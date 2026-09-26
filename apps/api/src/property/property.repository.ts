import type {
  ListParams,
  NewPropertyData,
  PropertyPage,
  PropertyRecord,
} from './property.types.js';

export interface PropertyRepository {
  /** Filter, then sort by (createdAt, id) in `sortOrder`, then paginate. */
  list(params: ListParams): Promise<PropertyPage>;
  findById(id: string): Promise<PropertyRecord | null>;
  findIdByAddressKey(addressKey: string): Promise<string | null>;
  /** Throws AlreadyExistsError if `addressKey` is taken. */
  create(data: NewPropertyData): Promise<PropertyRecord>;
  /** Throws NotFoundError if no property has this id. */
  delete(id: string): Promise<void>;
}
