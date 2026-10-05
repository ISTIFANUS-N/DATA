import type { Profile } from './types';

// Illustrative rates, not real market pricing. Airtime and data carry
// a small margin baked into face value already; resellers get a
// better cut since they're buying in the volume that justifies it.
// Electricity is deliberately untouched — DisCos bill at a fixed
// rate, there's no "wholesale" version of a bill.
const PACKAGE_RATES = {
  smart_user: { airtime: 1, data: 1, cable: 1 },
  reseller: { airtime: 0.98, data: 0.93, cable: 0.97 }
} as const;

export type PricedService = keyof typeof PACKAGE_RATES.smart_user;

export function applyPackagePricing(
  basePrice: number,
  service: PricedService,
  pkg: Profile['package']
): number {
  const rate = PACKAGE_RATES[pkg][service];
  return Math.round(basePrice * rate);
}

export function packageLabel(pkg: Profile['package']): string {
  return pkg === 'reseller' ? 'Reseller' : 'Smart User';
}

// ── Airtime cashback: customers pay full price; the admin sets a cashback per ₦100, per network and package ──
// e.g. 2 means ₦2 back for every ₦100 of airtime (₦20 back on ₦1,000).
export type AirtimeCashback = Record<string, Record<Profile['package'], number>>;

export const DEFAULT_AIRTIME_CASHBACK: AirtimeCashback = {
  MTN:       { smart_user: 0, reseller: 0 },
  GLO:       { smart_user: 0, reseller: 0 },
  AIRTEL:    { smart_user: 0, reseller: 0 },
  '9MOBILE': { smart_user: 0, reseller: 0 }
};

/**
 * Master switch. Cashback is OFF for now: customers see no cashback and none is paid.
 * Set to true to bring it back (the admin settings and profit cap below are kept ready).
 */
export const CASHBACK_ENABLED = false;

/** Cashback in Naira, rounded down to the kobo. Always 0 while CASHBACK_ENABLED is false. */
export function airtimeCashback(
  faceValue: number,
  network: string | null,
  pkg: Profile['package'],
  rates: AirtimeCashback = DEFAULT_AIRTIME_CASHBACK
): number {
  if (!CASHBACK_ENABLED) return 0;
  const per100 = rates[network ?? '']?.[pkg] ?? DEFAULT_AIRTIME_CASHBACK.MTN[pkg];
  return Math.floor(faceValue * per100) / 100;
}

/**
 * Caps cashback at our profit on the order, so cashback can never push an order into a loss.
 * `charged` is what the customer paid; `providerCost` is what the provider charged us.
 * If the provider didn't report a cost, the configured cashback is returned unchanged.
 */
export function limitCashbackToMargin(due: number, charged: number, providerCost?: number): number {
  if (providerCost === undefined || !Number.isFinite(providerCost)) return due;
  const margin = Math.floor((charged - providerCost) * 100) / 100;
  return Math.max(0, Math.min(due, margin));
}
