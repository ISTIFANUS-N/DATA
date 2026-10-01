import type { ProviderAdapter, ProviderResult } from './types';

// For testing the purchase flow without a provider account.
// A phone number ending in 0000 simulates a failure, 1111 a pending order.
function respond(phone: string): ProviderResult {
  if (phone.endsWith('0000')) return { status: 'failed', message: 'Mock: simulated failure' };
  if (phone.endsWith('1111')) return { status: 'pending', message: 'Mock: simulated pending' };
  return { status: 'success', providerRef: `MOCK${Date.now()}` };
}

export function createMock(): ProviderAdapter {
  return {
    id: 'mock',
    name: 'Mock provider',
    airtime: async (r) => respond(r.phone),
    data: async (r) => respond(r.phone),
    balance: async () => 100000
  };
}
