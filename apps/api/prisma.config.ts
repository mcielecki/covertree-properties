import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Prisma 7 no longer loads .env itself. The .env file sits at the repo root (shared with compose).
// Variables already set in the environment win, so callers can point the CLI at another database.
config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Not env(): that throws when unset, and `prisma generate` must work without a database.
  datasource: { url: process.env.DATABASE_URL },
});
