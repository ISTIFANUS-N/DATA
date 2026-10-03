import type { ProviderAdapter, ProviderResult } from './types';

// For testing the purchase flow without a provider account.
// A phone number ending in 0000 simulates a failure, 1111 a pending order.
function respond(phone: string): ProviderResult {
  if (phone.endsWith('0000')) return { status: 'failed', message: 'Mock: simulated failure' };
  if (phone.endsWith('1111')) return { status: 'pending', message: 'Mock: simulated pending' };
  return { status: 'success', providerRef: `MOCK${Date.now()}` };
}

// Numbers ending in 00 simulate "no account found".
function mockVerify(n: string) {
  return Promise.resolve(n.endsWith('00')
    ? { valid: false, error: 'No account found for this number. Check it and try again.' }
    : { valid: true, customerName: 'MOCK CUSTOMER', address: '1 Test Street, Lagos' });
}

export function createMock(): ProviderAdapter {
  return {
    id: 'mock',
    name: 'Mock provider',
    airtime: async (r) => respond(r.phone),
    data: async (r) => respond(r.phone),
    verifyMeter: (r) => mockVerify(r.meterNumber),
    verifySmartcard: (r) => mockVerify(r.smartcardNumber),
    requery: async () => ({ status: 'success' as const }),
    dataPlans: async (n) => [
      { code: `${n.toLowerCase()}-mock-1gb`, name: 'Mock 1GB - 30 days', amount: 500 },
      { code: `${n.toLowerCase()}-mock-2gb`, name: 'Mock 2GB - 30 days', amount: 1000 }
    ],
    balance: async () => 100000
  };
}
