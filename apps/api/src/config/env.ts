import { z } from 'zod';
import {
  DEFAULT_WEATHERSTACK_BASE_URL,
  DEFAULT_WEATHERSTACK_TIMEOUT_MS,
} from '../weather/weatherstack/weatherstack.provider.js';

// Environment variables from SPEC §6. Parsed once at startup in main.ts.
const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    WEATHER_PROVIDER: z.enum(['weatherstack', 'fake']).default('weatherstack'),
    WEATHERSTACK_API_KEY: z.string().optional(),
    WEATHERSTACK_BASE_URL: z.url().default(DEFAULT_WEATHERSTACK_BASE_URL),
    WEATHERSTACK_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(DEFAULT_WEATHERSTACK_TIMEOUT_MS),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
    // Only an explicit "development" adds originalError to masked errors (see main.ts).
    NODE_ENV: z.string().default('production'),
  })
  .refine((env) => env.WEATHER_PROVIDER === 'fake' || Boolean(env.WEATHERSTACK_API_KEY), {
    path: ['WEATHERSTACK_API_KEY'],
    error: 'required unless WEATHER_PROVIDER=fake',
  });

export type Env = z.output<typeof envSchema>;

/** Throws an Error naming each invalid variable. Values are never echoed (the key is secret). */
export function parseEnv(source: Readonly<Record<string, string | undefined>>): Env {
  // Empty strings (e.g. `PORT=` in .env) mean "not set", so defaults apply.
  const defined = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== ''),
  );
  const result = envSchema.safeParse(defined);
  if (result.success) {
    return result.data;
  }
  const problems = result.error.issues.map(
    (issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`,
  );
  throw new Error(`Invalid environment configuration:\n  ${problems.join('\n  ')}`);
}
