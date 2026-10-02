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
  MTN:       { smart_user: 0, reseller: 2 },
  GLO:       { smart_user: 0, reseller: 2 },
  AIRTEL:    { smart_user: 0, reseller: 2 },
  '9MOBILE': { smart_user: 0, reseller: 2 }
};

/** Cashback in Naira, rounded down to the kobo. */
export function airtimeCashback(
  faceValue: number,
  network: string | null,
  pkg: Profile['package'],
  rates: AirtimeCashback = DEFAULT_AIRTIME_CASHBACK
): number {
  const per100 = rates[network ?? '']?.[pkg] ?? DEFAULT_AIRTIME_CASHBACK.MTN[pkg];
  return Math.floor(faceValue * per100) / 100;
}
