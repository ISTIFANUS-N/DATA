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
