import { writable, get } from 'svelte/store';
import { persisted } from './persisted';
import {
  DEFAULT_DATA_PLANS,
  DEFAULT_CABLE_PLANS,
  type DataPlan,
  type CablePlan,
  type Network,
  type DataPlanType
} from '$lib/data/catalog';

export const dataPlans = persisted<DataPlan[]>('fanu_data_plans', DEFAULT_DATA_PLANS);
export const cablePlans = persisted<CablePlan[]>('fanu_cable_plans', DEFAULT_CABLE_PLANS);

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

// --- Data plans ---

export function adminAddDataPlan(input: Omit<DataPlan, 'id'>): DataPlan {
  const plan: DataPlan = { ...input, id: newId('plan') };
  dataPlans.update((list) => [plan, ...list]);
  return plan;
}

export function adminUpdateDataPlan(id: string, updates: Partial<Omit<DataPlan, 'id'>>): void {
  dataPlans.update((list) => list.map((p) => (p.id === id ? { ...p, ...updates } : p)));
}

export function adminDeleteDataPlan(id: string): void {
  dataPlans.update((list) => list.filter((p) => p.id !== id));
}

export function adminResetDataPlans(): void {
  dataPlans.set(DEFAULT_DATA_PLANS);
}

// --- Cable plans ---

export function adminAddCablePlan(input: Omit<CablePlan, 'id'>): CablePlan {
  const plan: CablePlan = { ...input, id: newId('cable') };
  cablePlans.update((list) => [plan, ...list]);
  return plan;
}

export function adminUpdateCablePlan(id: string, updates: Partial<Omit<CablePlan, 'id'>>): void {
  cablePlans.update((list) => list.map((p) => (p.id === id ? { ...p, ...updates } : p)));
}

export function adminDeleteCablePlan(id: string): void {
  cablePlans.update((list) => list.filter((p) => p.id !== id));
}

export function adminResetCablePlans(): void {
  cablePlans.set(DEFAULT_CABLE_PLANS);
}

export type { DataPlan, CablePlan, Network, DataPlanType };

// ---- Airtime pricing markups (per-network) ----
import { NETWORKS as _NETWORKS } from '$lib/data/catalog';

export interface AirtimeSetting {
  network: string;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
}

const DEFAULT_AIRTIME: AirtimeSetting[] = [
  { network: 'MTN', minAmount: 50, maxAmount: 50000, isActive: true },
  { network: 'GLO', minAmount: 50, maxAmount: 50000, isActive: true },
  { network: 'AIRTEL', minAmount: 50, maxAmount: 50000, isActive: true },
  { network: '9MOBILE', minAmount: 50, maxAmount: 50000, isActive: true }
];

export const airtimeSettings = persisted<AirtimeSetting[]>('fanu_airtime_settings', DEFAULT_AIRTIME);

export function adminUpdateAirtimeSetting(network: string, updates: Partial<Omit<AirtimeSetting, 'network'>>): void {
  airtimeSettings.update((list) => list.map((s) => s.network === network ? { ...s, ...updates } : s));
}

// ---- Disco (electricity providers) ----
import { DISCOS as _DISCOS, type Disco } from '$lib/data/catalog';

export interface DiscoSetting extends Disco {
  isActive: boolean;
  minAmount: number;
}

const DEFAULT_DISCOS: DiscoSetting[] = _DISCOS.map((d) => ({ ...d, isActive: true, minAmount: 500 }));

export const discoSettings = persisted<DiscoSetting[]>('fanu_disco_settings', DEFAULT_DISCOS);

export function adminUpdateDisco(code: string, updates: Partial<Omit<DiscoSetting, 'code'>>): void {
  discoSettings.update((list) => list.map((d) => d.code === code ? { ...d, ...updates } : d));
}

// ---- Bulk SMS packages ----
import { BULK_SMS_PACKAGES as _SMS, type BulkSmsPackage } from '$lib/data/catalog';

export const smsPackages = persisted<BulkSmsPackage[]>('fanu_sms_packages', _SMS);

export function adminUpdateSmsPackage(id: string, updates: Partial<Omit<BulkSmsPackage, 'id'>>): void {
  smsPackages.update((list) => list.map((p) => p.id === id ? { ...p, ...updates } : p));
}

export function adminAddSmsPackage(input: Omit<BulkSmsPackage, 'id'>): void {
  const id = `sms-${Date.now()}`;
  smsPackages.update((list) => [...list, { ...input, id }]);
}

export function adminDeleteSmsPackage(id: string): void {
  smsPackages.update((list) => list.filter((p) => p.id !== id));
}

// ---- Result checker pins ----
import { RESULT_CHECKER_PINS as _PINS, type ResultCheckerPin } from '$lib/data/catalog';

export const resultPins = persisted<ResultCheckerPin[]>('fanu_result_pins', _PINS);

export function adminUpdateResultPin(id: string, updates: Partial<Omit<ResultCheckerPin, 'id'>>): void {
  resultPins.update((list) => list.map((p) => p.id === id ? { ...p, ...updates } : p));
}

// ---- Recharge card denominations ----
export interface RechargeDenomination {
  value: number;
  isActive: boolean;
}

const DEFAULT_DENOMINATIONS: RechargeDenomination[] = [
  { value: 100, isActive: true },
  { value: 200, isActive: true },
  { value: 500, isActive: true },
  { value: 1000, isActive: true },
  { value: 1500, isActive: true }
];

export const rechargeDenominations = persisted<RechargeDenomination[]>('fanu_recharge_denoms', DEFAULT_DENOMINATIONS);

export function adminUpdateRechargeDenom(value: number, isActive: boolean): void {
  rechargeDenominations.update((list) => list.map((d) => d.value === value ? { ...d, isActive } : d));
}

export function adminAddRechargeDenom(value: number): void {
  rechargeDenominations.update((list) => {
    if (list.find((d) => d.value === value)) return list;
    return [...list, { value, isActive: true }].sort((a, b) => a.value - b.value);
  });
}

export function adminDeleteRechargeDenom(value: number): void {
  rechargeDenominations.update((list) => list.filter((d) => d.value !== value));
}

// Per-item active toggles (granular control within a service)
export function adminToggleDataPlan(id: string, isActive: boolean): void {
  dataPlans.update((list) => list.map((p) => p.id === id ? { ...p, isActive } : p));
}

export function adminToggleCablePlan(id: string, isActive: boolean): void {
  cablePlans.update((list) => list.map((p) => p.id === id ? { ...p, isActive } : p));
}

export function adminToggleSmsPackage(id: string, isActive: boolean): void {
  smsPackages.update((list) => list.map((p) => p.id === id ? { ...p, isActive } : p));
}

export function adminToggleResultPin(id: string, isActive: boolean): void {
  resultPins.update((list) => list.map((p) => p.id === id ? { ...p, isActive } : p));
}

// Bulk toggle: disable/enable all plans for a specific network
export function adminToggleNetworkDataPlans(network: string, isActive: boolean): void {
  dataPlans.update((list) =>
    list.map((p) => p.network === network ? { ...p, isActive } : p)
  );
}

// Bulk toggle: disable/enable all plans of a specific type (SME, GIFTING, etc.)
export function adminTogglePlanType(type: string, isActive: boolean): void {
  dataPlans.update((list) =>
    list.map((p) => p.type === type ? { ...p, isActive } : p)
  );
}

// Bulk toggle: disable/enable all cable plans for a specific provider
export function adminToggleCableProvider(provider: string, isActive: boolean): void {
  cablePlans.update((list) =>
    list.map((p) => p.provider === provider ? { ...p, isActive } : p)
  );
}
