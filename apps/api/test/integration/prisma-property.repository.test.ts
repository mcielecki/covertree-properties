import { afterAll } from 'vitest';
import type { Prisma } from '../../src/generated/prisma/client.js';
import { PrismaPropertyRepository } from '../../src/property/prisma-property.repository.js';
import { describePropertyRepositoryContract } from '../../src/property/property.repository.contract.js';
import type { WeatherCurrent } from '../../src/weather/weather-provider.js';
import { createTestPrismaClient, truncateAll } from '../helpers/db.js';

const prisma = createTestPrismaClient();
const repo = new PrismaPropertyRepository(prisma);

afterAll(async () => {
  await prisma.$disconnect();
});

describePropertyRepositoryContract('Prisma', async () => {
  await truncateAll(prisma);
  return {
    repo,
    // createdAt is DB-generated in the real flow; tests set it directly to control ordering.
    insertAt: async (data, createdAt) => {
      const row = await prisma.property.create({
        data: { ...data, createdAt, weatherData: data.weatherData as Prisma.InputJsonObject },
        omit: { cityKey: true, addressKey: true },
      });
      return { ...row, weatherData: row.weatherData as WeatherCurrent };
    },
  };
});
