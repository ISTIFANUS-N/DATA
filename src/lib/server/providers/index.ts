import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { createFlowpay } from './flowpay';
import { createMock } from './mock';
import { createVtpass } from './vtpass';
import type { ProviderAdapter, ProviderService } from './types';
import { ProviderUnavailable } from './types';

// Add new providers here: one line per API.
const REGISTRY: Record<string, () => ProviderAdapter> = {
  vtpass: createVtpass,
  flowpay: createFlowpay,
  mock: createMock
};

/**
 * Which provider serves a service is an environment setting, so switching APIs
 * is a config change + redeploy, with secrets kept server-side:
 *   PROVIDER_AIRTIME=vtpass
 *   PROVIDER_DATA=vtpass
 *   PROVIDER_ELECTRICITY=vtpass   (meter verification)
 *   PROVIDER_CABLE=vtpass         (smartcard verification)
 * Nothing configured means the service reports "unavailable" — never a silent mock.
 */
const METHOD = {
  airtime: 'airtime', data: 'data', electricity: 'verifyMeter', cable: 'verifySmartcard'
} as const;

export function getProvider(service: ProviderService): ProviderAdapter {
  const id = (env[`PROVIDER_${service.toUpperCase()}`] ?? '').trim().toLowerCase();
  if (!id) throw new ProviderUnavailable(`No provider configured for ${service}`);

  if (id === 'mock' && !(dev || env.ALLOW_MOCK_PROVIDER === 'true')) {
    throw new ProviderUnavailable('The mock provider is disabled outside development');
  }
  const factory = REGISTRY[id];
  if (!factory) throw new ProviderUnavailable(`Unknown provider "${id}"`);

  const adapter = factory();
  if (!adapter[METHOD[service]]) throw new ProviderUnavailable(`${adapter.name} does not support ${service}`);
  return adapter;
}

/** Our transaction reference. Starts with Lagos time (YYYYMMDDHHmm), which VTpass requires of request ids. */
export function newReference(): string {
  const lagos = new Date(Date.now() + 60 * 60 * 1000).toISOString().replace(/\D/g, '').slice(0, 12);
  return `${lagos}${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}
