import { env } from '$env/dynamic/private';
import type { Network, ProviderAdapter, ProviderPlan, ProviderResult } from './types';
import { ProviderUnavailable } from './types';
import { parseFlowpayPlans, parseFlowpayResponse } from './flowpayParse';

// FlowPay network ids
const NETWORK_ID: Record<Network, number> = { MTN: 1, GLO: 2, '9MOBILE': 3, AIRTEL: 4 };

/** FLOWPAY_BASE_URL is the API root, e.g. https://<host>/api  (endpoints are appended: /data, /data/{ref}). */
function baseUrl(): string {
  if (!env.FLOWPAY_BASE_URL) throw new ProviderUnavailable('FLOWPAY_BASE_URL is not set');
  return env.FLOWPAY_BASE_URL.replace(/\/+$/, '');
}

function headers() {
  if (!env.FLOWPAY_API_TOKEN) throw new ProviderUnavailable('FLOWPAY_API_TOKEN is not set');
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.FLOWPAY_API_TOKEN}`
  };
}

async function get(path: string): Promise<{ status: number; json: any }> {
  const { Accept, Authorization } = headers();
  const res = await fetch(`${baseUrl()}${path}`, { headers: { Accept, Authorization } });
  return { status: res.status, json: await res.json().catch(() => null) };
}

async function post(path: string, body: Record<string, unknown>): Promise<ProviderResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      method: 'POST', headers: headers(), body: JSON.stringify(body), signal: ctrl.signal
    });
    const json = await res.json().catch(() => null);
    const parsed = parseFlowpayResponse(res.status, json);
    if (parsed.blocked) {
      // Wrong token, or this server's IP isn't whitelisted at FlowPay. Surface it loudly in the logs.
      console.error('flowpay: access denied:', parsed.message);
      throw new ProviderUnavailable(parsed.message ?? 'FlowPay denied access');
    }
    return { status: parsed.status, providerRef: parsed.providerRef, message: parsed.message };
  } catch (e) {
    if (e instanceof ProviderUnavailable) throw e;
    // Timeout / network drop: the order may have gone through. Don't refund blindly.
    return { status: 'pending', message: 'No response from provider' };
  } finally {
    clearTimeout(timer);
  }
}

export function createFlowpay(): ProviderAdapter {
  return {
    id: 'flowpay',
    name: 'FlowPay',

    // Our reference is appended to the URL, which FlowPay uses for idempotency.
    // `planCode` must be FlowPay's numeric data-plan id (set it in Admin → Data Plans → API Plan ID).
    data: async (r) => {
      const plan = Number(r.planCode);
      if (!Number.isInteger(plan) || plan <= 0) {
        return { status: 'failed', message: `Invalid FlowPay plan id "${r.planCode}"` }; // nothing was sent
      }
      return post(`/data/${encodeURIComponent(r.reference)}`, {
        plan, mobile_number: r.phone, network: NETWORK_ID[r.network]
      });
    },

    // FlowPay only accepts airtime between ₦50 and ₦5,000.
    airtimeLimits: { min: 50, max: 5000 },

    airtime: (r) => post(`/topup/${encodeURIComponent(r.reference)}`, {
      amount: r.amount, mobile_number: r.phone, network: NETWORK_ID[r.network]
    }),

    // Lists FlowPay's plans (with their integer ids) so admins can pick the right API Plan ID.
    // Prefers the detailed endpoint, which includes the API price; falls back to the plain list.
    async dataPlans(network): Promise<ProviderPlan[]> {
      const detailed = await get(`/data-plans-prices/filtered?mobile_network=${NETWORK_ID[network]}`);
      if (detailed.status === 401 || detailed.status === 403) {
        throw new ProviderUnavailable(detailed.json?.message ?? 'FlowPay denied access');
      }
      let plans = detailed.status === 200 ? parseFlowpayPlans(detailed.json, network) : [];
      if (!plans.length) {
        const plain = await get('/data_plans');
        plans = plain.status === 200 ? parseFlowpayPlans(plain.json, network) : [];
      }
      return plans;
    }

    // Order status checks are added once FlowPay's docs for them are in.
  };
}
