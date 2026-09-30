import { persisted } from './persisted';
import { derived } from 'svelte/store';

// ---- Top-level service toggles ----
// Disabling a service blocks the entire customer-facing flow for it.
// More granular control (per network, per plan type) is handled within
// each service's own store (dataPlans isActive per plan, airtimeSettings
// isActive per network, etc.)

export type ServiceKey =
  | 'data'
  | 'airtime'
  | 'cable'
  | 'electricity'
  | 'bulk_sms'
  | 'result_checker'
  | 'recharge_cards'
  | 'airtime_to_cash';

export interface ServiceToggle {
  key: ServiceKey;
  label: string;
  route: string;
  isEnabled: boolean;
  disabledReason: string; // shown to customer when service is off
}

const DEFAULT_SERVICES: ServiceToggle[] = [
  { key: 'data', label: 'Buy data', route: '/buy-data', isEnabled: true, disabledReason: 'Data purchase is temporarily unavailable. Please try again later.' },
  { key: 'airtime', label: 'Buy airtime', route: '/buy-airtime', isEnabled: true, disabledReason: 'Airtime purchase is temporarily unavailable. Please try again later.' },
  { key: 'cable', label: 'Cable TV', route: '/tv-subscription', isEnabled: true, disabledReason: 'Cable TV subscription is temporarily unavailable. Please try again later.' },
  { key: 'electricity', label: 'Electricity', route: '/electricity-bill', isEnabled: true, disabledReason: 'Electricity bill payment is temporarily unavailable. Please try again later.' },
  { key: 'bulk_sms', label: 'Bulk SMS', route: '/bulk-sms', isEnabled: true, disabledReason: 'Bulk SMS is temporarily unavailable. Please try again later.' },
  { key: 'result_checker', label: 'Result checker', route: '/result-checker', isEnabled: true, disabledReason: 'Result checker is temporarily unavailable. Please try again later.' },
  { key: 'recharge_cards', label: 'Recharge card printing', route: '/recharge-card-printing', isEnabled: true, disabledReason: 'Recharge card printing is temporarily unavailable. Please try again later.' },
  { key: 'airtime_to_cash', label: 'Airtime to cash', route: '/airtime-to-cash', isEnabled: true, disabledReason: 'Airtime to cash is temporarily unavailable. Please try again later.' }
];

export const serviceToggles = persisted<ServiceToggle[]>('fanu_service_toggles', DEFAULT_SERVICES);

export function isServiceEnabled(key: ServiceKey): boolean {
  // Browser-safe synchronous read from localStorage
  try {
    const stored = JSON.parse(localStorage.getItem('fanu_service_toggles') ?? 'null');
    if (Array.isArray(stored)) {
      const found = stored.find((s: ServiceToggle) => s.key === key);
      return found?.isEnabled ?? true;
    }
  } catch { /* */ }
  return true;
}

export function getDisabledReason(key: ServiceKey): string {
  try {
    const stored = JSON.parse(localStorage.getItem('fanu_service_toggles') ?? 'null');
    if (Array.isArray(stored)) {
      const found = stored.find((s: ServiceToggle) => s.key === key);
      return found?.disabledReason ?? 'This service is temporarily unavailable.';
    }
  } catch { /* */ }
  return 'This service is temporarily unavailable.';
}

export function adminToggleService(key: ServiceKey, enabled: boolean): void {
  serviceToggles.update((list) =>
    list.map((s) => (s.key === key ? { ...s, isEnabled: enabled } : s))
  );
}

export function adminSetServiceReason(key: ServiceKey, reason: string): void {
  serviceToggles.update((list) =>
    list.map((s) => (s.key === key ? { ...s, disabledReason: reason } : s))
  );
}

export const disabledServicesCount = derived(
  serviceToggles,
  ($s) => $s.filter((s) => !s.isEnabled).length
);
