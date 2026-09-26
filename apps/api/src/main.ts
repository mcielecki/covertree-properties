import { config as loadDotenv } from 'dotenv';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { parseEnv } from './config/env.js';
import { createPrismaClient } from './db/prisma.js';
import type { Logger } from './logger.js';
import { PrismaPropertyRepository } from './property/prisma-property.repository.js';
import { PropertyService } from './property/property.service.js';
import { FakeWeatherProvider } from './weather/fake-weather.provider.js';
import type { WeatherProvider } from './weather/weather-provider.js';
import { WeatherstackProvider } from './weather/weatherstack/weatherstack.provider.js';

// The repo-root .env (`pnpm dev` runs in apps/api). Variables already set in the environment win.
loadDotenv({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });

const logger: Logger = console;
const env = parseEnv(process.env);

let weather: WeatherProvider;
if (env.WEATHER_PROVIDER === 'fake') {
  logger.warn(
    'WEATHER_PROVIDER=fake: weather data and coordinates are FAKE, Weatherstack will not be called',
  );
  weather = new FakeWeatherProvider();
} else {
  weather = new WeatherstackProvider({
    // parseEnv guarantees the key when the provider is weatherstack.
    apiKey: env.WEATHERSTACK_API_KEY ?? '',
    baseUrl: env.WEATHERSTACK_BASE_URL,
    timeoutMs: env.WEATHERSTACK_TIMEOUT_MS,
    logger,
  });
}

const prisma = createPrismaClient(env.DATABASE_URL);
const app = createApp({
  propertyService: new PropertyService(new PrismaPropertyRepository(prisma), weather),
  logger,
  corsOrigin: env.CORS_ORIGIN,
  isDev: env.NODE_ENV === 'development',
});

const server = createServer(app.requestListener);
server.listen(env.PORT, () => {
  logger.info(`GraphQL API listening on http://localhost:${env.PORT}${app.graphqlEndpoint}`);
});

function shutdown(signal: string): void {
  logger.info(`${signal} received, shutting down`);
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
