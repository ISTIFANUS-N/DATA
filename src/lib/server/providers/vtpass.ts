import { env } from '$env/dynamic/private';
import type { Network, ProviderAdapter, ProviderResult } from './types';
import { ProviderUnavailable } from './types';

const AIRTIME_SERVICE: Record<Network, string> = {
  MTN: 'mtn', GLO: 'glo', AIRTEL: 'airtel', '9MOBILE': 'etisalat'
};
const DATA_SERVICE: Record<Network, string> = {
  MTN: 'mtn-data', GLO: 'glo-data', AIRTEL: 'airtel-data', '9MOBILE': 'etisalat-data'
};

function baseUrl() {
  return env.VTPASS_BASE_URL || 'https://sandbox.vtpass.com/api';
}

function headers() {
  if (!env.VTPASS_API_KEY || !env.VTPASS_SECRET_KEY) {
    throw new ProviderUnavailable('VTpass keys are not set');
  }
  return {
    'api-key': env.VTPASS_API_KEY,
    'secret-key': env.VTPASS_SECRET_KEY,
    'Content-Type': 'application/json'
  };
}

function mapStatus(s: unknown): ProviderResult['status'] {
  switch (String(s ?? '').toLowerCase()) {
    case 'delivered': return 'success';
    case 'failed':
    case 'reversed':  return 'failed';
    default:          return 'pending'; // initiated / pending / unknown
  }
}

async function pay(body: Record<string, unknown>): Promise<ProviderResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch(`${baseUrl()}/pay`, {
      method: 'POST', headers: headers(), body: JSON.stringify(body), signal: ctrl.signal
    });
    const json = await res.json().catch(() => null);
    if (!json) return { status: 'pending', message: 'Unreadable provider response' };

    const tx = json.content?.transactions;
    // "000" = request processed (check the transaction status); "099" = still processing.
    if (json.code === '000') {
      return { status: mapStatus(tx?.status), providerRef: tx?.transactionId, message: json.response_description };
    }
    if (json.code === '099') return { status: 'pending', message: json.response_description };
    return { status: 'failed', message: json.response_description ?? 'Provider rejected the request' };
  } catch (e) {
    if (e instanceof ProviderUnavailable) throw e;
    // Timeout / network drop: the request may have gone through. Don't refund blindly.
    return { status: 'pending', message: 'No response from provider' };
  } finally {
    clearTimeout(timer);
  }
}

export function createVtpass(): ProviderAdapter {
  return {
    id: 'vtpass',
    name: 'VTpass',

    airtime: (r) => pay({
      request_id: r.reference,
      serviceID: AIRTIME_SERVICE[r.network],
      amount: r.amount,
      phone: r.phone
    }),

    data: (r) => pay({
      request_id: r.reference,
      serviceID: DATA_SERVICE[r.network],
      billersCode: r.phone,
      variation_code: r.planCode,
      phone: r.phone
    }),

    async balance() {
      const res = await fetch(`${baseUrl()}/balance`, { headers: headers() });
      const json = await res.json();
      return Number(json?.contents?.balance ?? 0);
    }
  };
}
