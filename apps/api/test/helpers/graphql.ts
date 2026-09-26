import { vi } from 'vitest';
import { createApp, type App } from '../../src/app.js';
import type { PrismaClient } from '../../src/generated/prisma/client.js';
import type { Prisma } from '../../src/generated/prisma/client.js';
import type { Logger } from '../../src/logger.js';
import { PrismaPropertyRepository } from '../../src/property/prisma-property.repository.js';
import {
  buildNewProperty,
  type AddressOverrides,
} from '../../src/property/property.repository.contract.js';
import { PropertyService } from '../../src/property/property.service.js';
import { FakeWeatherProvider } from '../../src/weather/fake-weather.provider.js';
import type { WeatherProvider } from '../../src/weather/weather-provider.js';
import { createTestPrismaClient } from './db.js';

export interface ResponseError {
  message: string;
  path?: (string | number)[];
  /** Absent on request errors such as variable coercion failures. */
  extensions?: { code: string; [key: string]: unknown };
}

export interface GraphQLResponse<TData> {
  status: number;
  body: { data?: TData | null; errors?: ResponseError[] };
}

export interface TestApp {
  app: App;
  logError: ReturnType<typeof vi.fn<Logger['error']>>;
}

/** The real app wired like main.ts, with the test database and the given weather provider. */
export function createTestApp(prisma: PrismaClient, weather: WeatherProvider): TestApp {
  const logError = vi.fn<Logger['error']>();
  const app = createApp({
    propertyService: new PropertyService(new PrismaPropertyRepository(prisma), weather),
    logger: { info: vi.fn(), warn: vi.fn(), error: logError },
    corsOrigin: 'http://localhost:5173',
  });
  return { app, logError };
}

/** Everything one integration test file needs; truncate `prisma` and reset `weather` per test. */
export function createIntegrationHarness() {
  const prisma = createTestPrismaClient();
  const weather = new FakeWeatherProvider();
  return { prisma, weather, ...createTestApp(prisma, weather) };
}

/** POSTs a GraphQL request through `yoga.fetch` (no network port). */
export async function gql<TData = Record<string, unknown>>(
  app: App,
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLResponse<TData>> {
  const response = await app.fetch('http://localhost/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      // What Apollo Client sends. Yoga then answers request errors with HTTP 400 (GraphQL over HTTP).
      accept: 'application/graphql-response+json, application/json;q=0.9',
    },
    body: JSON.stringify({ query, variables }),
  });
  return {
    status: response.status,
    body: (await response.json()) as GraphQLResponse<TData>['body'],
  };
}

/** Stores a property directly, with a fixed `createdAt`, so ordering does not depend on the clock. */
export async function insertProperty(
  prisma: PrismaClient,
  overrides: AddressOverrides = {},
  createdAt?: Date,
): Promise<string> {
  const data = buildNewProperty(overrides);
  const row = await prisma.property.create({
    data: { ...data, createdAt, weatherData: data.weatherData as Prisma.InputJsonObject },
    select: { id: true },
  });
  return row.id;
}

/** `count` properties with distinct streets, created one minute apart (oldest first). */
export async function insertMany(
  prisma: PrismaClient,
  count: number,
  overrides: AddressOverrides = {},
): Promise<string[]> {
  const start = Date.UTC(2026, 0, 1);
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(
      await insertProperty(
        prisma,
        { street: `${i + 1} Main St`, ...overrides },
        new Date(start + i * 60_000),
      ),
    );
  }
  return ids;
}

export function errorCodes(response: GraphQLResponse<unknown>): string[] {
  return (response.body.errors ?? []).map((error) => error.extensions?.code ?? '(none)');
}
