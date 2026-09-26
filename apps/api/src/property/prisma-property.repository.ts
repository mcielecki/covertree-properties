import { AlreadyExistsError, NotFoundError } from '../errors/domain-errors.js';
import { Prisma, type PrismaClient } from '../generated/prisma/client.js';
import type { WeatherCurrent } from '../weather/weather-provider.js';
import type { PropertyRepository } from './property.repository.js';
import type {
  ListParams,
  NewPropertyData,
  PropertyPage,
  PropertyRecord,
} from './property.types.js';

/** Key columns are a storage detail; they never leave the repository. */
const OMIT_KEYS = { cityKey: true, addressKey: true } satisfies Prisma.PropertyOmit;

type PropertyRow = Prisma.PropertyGetPayload<{ omit: typeof OMIT_KEYS }>;

/** The only module that touches Prisma. Maps P2002 → AlreadyExistsError, P2025 → NotFoundError. */
export class PrismaPropertyRepository implements PropertyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list({ filter, sortOrder, limit, offset }: ListParams): Promise<PropertyPage> {
    const where: Prisma.PropertyWhereInput = {
      cityKey: filter.cityKey,
      zipCode: filter.zipCode,
      state: filter.state,
    };
    const direction = sortOrder === 'ASC' ? 'asc' : 'desc';
    const [totalCount, rows] = await this.prisma.$transaction([
      this.prisma.property.count({ where }),
      this.prisma.property.findMany({
        where,
        omit: OMIT_KEYS,
        orderBy: [{ createdAt: direction }, { id: direction }],
        take: limit,
        skip: offset,
      }),
    ]);
    return { items: rows.map(toRecord), totalCount };
  }

  async findById(id: string): Promise<PropertyRecord | null> {
    const row = await this.prisma.property.findUnique({ where: { id }, omit: OMIT_KEYS });
    return row ? toRecord(row) : null;
  }

  async findIdByAddressKey(addressKey: string): Promise<string | null> {
    const row = await this.prisma.property.findUnique({
      where: { addressKey },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async create(data: NewPropertyData): Promise<PropertyRecord> {
    try {
      const row = await this.prisma.property.create({
        data: { ...data, weatherData: data.weatherData as Prisma.InputJsonObject },
        omit: OMIT_KEYS,
      });
      return toRecord(row);
    } catch (error) {
      if (isKnownError(error, 'P2002')) {
        throw new AlreadyExistsError();
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.property.delete({ where: { id } });
    } catch (error) {
      if (isKnownError(error, 'P2025')) {
        throw new NotFoundError(id);
      }
      throw error;
    }
  }
}

function isKnownError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

function toRecord({ weatherData, ...row }: PropertyRow): PropertyRecord {
  // Validated by the weather adapter before it was stored (SPEC §4.3).
  return { ...row, weatherData: weatherData as WeatherCurrent };
}
