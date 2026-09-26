import { inject } from 'vitest';
import { createPrismaClient } from '../../src/db/prisma.js';
import type { PrismaClient } from '../../src/generated/prisma/client.js';

/** Client for the database that global-setup verified and migrated. */
export function createTestPrismaClient(): PrismaClient {
  return createPrismaClient(inject('testDatabaseUrl'));
}

export async function truncateAll(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE properties');
}
