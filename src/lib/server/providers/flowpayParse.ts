import type { ProviderStatus } from './types';

// Pure response interpretation for FlowPay (no SvelteKit imports, so it is easy to test).

export interface FlowpayParsed {
  status: ProviderStatus;
  providerRef?: string;
  message?: string;
  /** What FlowPay charged our wallet for this order, in Naira. */
  cost?: number;
  /** Token rejected or IP not whitelisted: nothing was sent, and the cause is our configuration. */
  blocked?: boolean;
}

function firstError(json: any): string | undefined {
  const errors = json?.errors;
  if (errors && typeof errors === 'object') {
    for (const v of Object.values(errors)) {
      if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
    }
  }
  return typeof json?.message === 'string' ? json.message : undefined;
}

/** "1,770.00" -> 1770 */
function money(v: unknown): number | undefined {
  const n = Number(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

/** Our real cost: the drop in our FlowPay balance, or the "amount" they report as charged. */
function costOf(d: any): number | undefined {
  const before = money(d?.balance_before);
  const after = money(d?.balance_after);
  if (before !== undefined && after !== undefined && before - after > 0) return Math.round((before - after) * 100) / 100;
  const amount = money(d?.amount);
  return amount !== undefined && amount > 0 ? amount : undefined;
}

function mapStatus(s: unknown): ProviderStatus {
  switch (String(s ?? '').toLowerCase()) {
    case 'successful':
    case 'success':    return 'success';
    case 'failed':     return 'failed';
    default:           return 'pending'; // pending / processing / anything unexpected
  }
}

/**
 * HTTP 422 means FlowPay rejected or failed the order (validation, balance, provider failure): safe to refund.
 * 401/403 means our token/IP is not accepted, and 404/405 a wrong base URL: nothing was sent. 429 means nothing was processed.
 * Anything we can't read, and 5xx, is treated as pending so a delivered order is never refunded by mistake.
 */
export function parseFlowpayResponse(http: number, json: any): FlowpayParsed {
  if (http === 401 || http === 403) {
    return { status: 'failed', blocked: true, message: json?.message ?? 'Access denied by provider' };
  }
  if (http === 404 || http === 405) {
    // Wrong FLOWPAY_BASE_URL: the order never reached FlowPay.
    return { status: 'failed', blocked: true, message: 'FlowPay endpoint not found. Check FLOWPAY_BASE_URL (it should end in /api).' };
  }
  if (http === 429) return { status: 'failed', message: 'Provider rate limit reached. Try again shortly.' };

  const d = json?.data;
  if (d && d.Status !== undefined) {
    return { status: mapStatus(d.Status), providerRef: d.ident ? String(d.ident) : undefined, message: d.api_response, cost: costOf(d) };
  }
  if (http === 422) return { status: 'failed', message: firstError(json) ?? 'Provider rejected the order' };
  return { status: 'pending', message: 'Awaiting provider confirmation' };
}

// ── Data plan lists ────────────────────────────────────────────────────────────────

export interface FlowpayPlan {
  code: string;    // FlowPay's integer plan id, as text
  name: string;
  amount: number;  // what FlowPay charges you (api_amount when available)
  size?: number;
  unit?: 'MB' | 'GB';
  validity?: string;
  type?: string;
}

function normNetwork(n: unknown): string {
  const s = String(n ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return s === 'etisalat' ? '9mobile' : s;
}

function planFrom(p: any, typeName: string): FlowpayPlan | null {
  if (!p || p.id === undefined || p.active === false) return null;
  const amount = Number(p.api_amount ?? p.amount);
  if (!Number.isFinite(amount)) return null;
  const type = typeName || p.type || '';
  const size = Number(p.size);
  const unit = String(p.volume ?? '').toUpperCase();
  return {
    code: String(p.id),
    name: `${p.size ?? ''}${p.volume ?? ''}${type ? ` ${type}` : ''} - ${p.validity ?? ''}`.trim(),
    amount,
    size: Number.isFinite(size) && size > 0 ? size : undefined,
    unit: unit === 'MB' || unit === 'GB' ? unit : undefined,
    validity: p.validity ? String(p.validity) : undefined,
    type: type || undefined
  };
}

/**
 * Reads either FlowPay plan list:
 *  - /data-plans-prices/filtered -> { data: [{ name, data_plan_types: [{ name, plans: [...] }] }] }
 *  - /data_plans                 -> [{ id, size, volume, validity, amount, network, type }]
 * Only plans for `network` (e.g. "MTN", "9MOBILE") are returned.
 */
export function parseFlowpayPlans(json: any, network: string): FlowpayPlan[] {
  const want = normNetwork(network);
  const out: FlowpayPlan[] = [];

  const groups = Array.isArray(json?.data) ? json.data : null;
  if (groups) {
    for (const g of groups) {
      if (normNetwork(g?.name ?? g?.code) !== want) continue;
      for (const t of g?.data_plan_types ?? []) {
        if (t?.active === false) continue;
        for (const p of t?.plans ?? []) {
          const plan = planFrom(p, String(t?.name ?? ''));
          if (plan) out.push(plan);
        }
      }
    }
    return out;
  }

  if (Array.isArray(json)) {
    for (const p of json) {
      if (normNetwork(p?.network) !== want) continue;
      const plan = planFrom(p, String(p?.type ?? ''));
      if (plan) out.push(plan);
    }
  }
  return out;
}
