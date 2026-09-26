import { z } from 'zod';
import { LocationNotFoundError, WeatherUnavailableError } from '../../errors/domain-errors.js';
import type { Logger } from '../../logger.js';
import type { WeatherCurrent, WeatherLookup, WeatherProvider } from '../weather-provider.js';
import {
  US_COUNTRY_NAMES,
  weatherstackErrorBodySchema,
  weatherstackSuccessBodySchema,
} from './weatherstack.schema.js';

export const DEFAULT_WEATHERSTACK_BASE_URL = 'https://api.weatherstack.com';
export const DEFAULT_WEATHERSTACK_TIMEOUT_MS = 5000;

const LOCATION_NOT_FOUND_CODE = 615;

// Provider free text could echo the request URL (with the key), so only known-safe shapes are
// logged or put into error messages (AC-5.13).
const SAFE_ERROR_TYPE = /^[a-z_]+$/;
const SAFE_COUNTRY = /^[A-Za-z .'-]{1,60}$/;

function safeText(value: string, pattern: RegExp): string {
  return pattern.test(value) ? value : 'unknown';
}

export interface WeatherstackProviderOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
  logger?: Logger;
}

/**
 * Real Weatherstack adapter (SPEC §4). One request per call, no retries.
 * Never logs the request URL: it carries the API key.
 */
export class WeatherstackProvider implements WeatherProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetch: typeof fetch;
  private readonly logger: Logger;

  constructor(options: WeatherstackProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? DEFAULT_WEATHERSTACK_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_WEATHERSTACK_TIMEOUT_MS;
    this.fetch = options.fetch ?? globalThis.fetch;
    this.logger = options.logger ?? console;
  }

  async getCurrentByZip(zipCode: string): Promise<WeatherLookup> {
    const started = Date.now();
    const log = (details: Record<string, unknown>) => ({
      zipCode,
      durationMs: Date.now() - started,
      ...details,
    });

    let response: Response;
    try {
      response = await this.fetch(this.buildUrl(zipCode), {
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      const timedOut =
        error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
      const reason = timedOut ? `timed out after ${this.timeoutMs} ms` : 'network error';
      // Only the error name: a message could echo the request URL.
      this.logger.warn(
        'Weatherstack request failed',
        log({ reason, errorName: error instanceof Error ? error.name : typeof error }),
      );
      throw new WeatherUnavailableError(reason);
    }

    if (!response.ok) {
      this.logger.warn('Weatherstack returned a non-2xx status', log({ status: response.status }));
      throw new WeatherUnavailableError(`HTTP ${response.status}`);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      this.logger.warn('Weatherstack returned a non-JSON body', log({ status: response.status }));
      throw new WeatherUnavailableError('response is not JSON');
    }

    const errorBody = weatherstackErrorBodySchema.safeParse(body);
    if (errorBody.success) {
      const { code } = errorBody.data.error;
      const type = safeText(errorBody.data.error.type, SAFE_ERROR_TYPE);
      this.logger.warn(
        'Weatherstack returned an error',
        log({ status: response.status, errorCode: code, errorType: type }),
      );
      if (code === LOCATION_NOT_FOUND_CODE) {
        throw new LocationNotFoundError(zipCode, 'unknown location');
      }
      throw new WeatherUnavailableError(`provider error ${code} (${type})`, {
        providerCode: code,
      });
    }

    const parsed = weatherstackSuccessBodySchema.safeParse(body);
    if (!parsed.success) {
      // Issues only (paths + messages), never the body.
      this.logger.warn(
        'Weatherstack response failed validation',
        log({ status: response.status, issues: z.flattenError(parsed.error).fieldErrors }),
      );
      throw new WeatherUnavailableError('unexpected response shape');
    }

    const { location, current } = parsed.data;
    if (!US_COUNTRY_NAMES.includes(location.country)) {
      this.logger.warn(
        'Weatherstack resolved a location outside the US',
        log({ status: response.status, country: safeText(location.country, SAFE_COUNTRY) }),
      );
      throw new LocationNotFoundError(zipCode, 'resolved outside the US');
    }

    this.logger.info('Weatherstack lookup succeeded', log({ status: response.status }));
    return { lat: location.lat, long: location.lon, current: withoutUndefined(current) };
  }

  private buildUrl(zipCode: string): URL {
    // Trailing slash so a base path (e.g. http://host/v1) is kept by relative resolution.
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const url = new URL('current', base);
    url.searchParams.set('access_key', this.apiKey);
    url.searchParams.set('query', zipCode);
    url.searchParams.set('units', 'f');
    return url;
  }
}

/** Optional fields rejected by `.catch(undefined)` come back as `key: undefined`; drop them (§4.3 step 5). */
function withoutUndefined(current: WeatherCurrent): WeatherCurrent {
  return Object.fromEntries(
    Object.entries(current).filter(([, value]) => value !== undefined),
  ) as WeatherCurrent;
}
