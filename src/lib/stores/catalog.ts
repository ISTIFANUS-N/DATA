import { writable, get } from 'svelte/store';
import { persisted } from './persisted';
import { supabase } from '$lib/supabase';
import {
  DEFAULT_DATA_PLANS,
  DEFAULT_CABLE_PLANS,
  type DataPlan,
  type CablePlan,
  type Network,
  type DataPlanType
} from '$lib/data/catalog';

// Data plans live in Supabase (supabase/data_plans.sql) so every customer sees what admins set.
// Until the table exists or loads, the five starter plans are shown.
export const dataPlans = writable<DataPlan[]>(DEFAULT_DATA_PLANS);
export const cablePlans = persisted<CablePlan[]>('fanu_cable_plans', DEFAULT_CABLE_PLANS);

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

// --- Data plans ---

type DbResult = { ok: true } | { ok: false; error: string };

const UNIT_ORDER: Record<string, number> = { MB: 0, GB: 1 };

function fromRow(r: any): DataPlan {
  return {
    id: r.id, network: r.network, type: r.plan_type, apiPlanId: r.api_plan_id,
    sizeValue: Number(r.size_value), sizeUnit: r.size_unit, validity: r.validity,
    price: Number(r.price), isActive: !!r.is_active
  };
}

function toRow(p: Partial<DataPlan>) {
  const row: Record<string, unknown> = {};
  if (p.network !== undefined) row.network = p.network;
  if (p.type !== undefined) row.plan_type = p.type;
  if (p.apiPlanId !== undefined) row.api_plan_id = p.apiPlanId;
  if (p.sizeValue !== undefined) row.size_value = p.sizeValue;
  if (p.sizeUnit !== undefined) row.size_unit = p.sizeUnit;
  if (p.validity !== undefined) row.validity = p.validity;
  if (p.price !== undefined) row.price = p.price;
  if (p.isActive !== undefined) row.is_active = p.isActive;
  return row;
}

export async function loadDataPlans(): Promise<void> {
  const { data, error } = await supabase.from('catalog_data_plans').select('*');
  if (error || !data) return; // table not created yet: keep the starter plans
  const plans = data.map(fromRow).sort((a, b) =>
    a.network.localeCompare(b.network) ||
    (UNIT_ORDER[a.sizeUnit] ?? 1) - (UNIT_ORDER[b.sizeUnit] ?? 1) ||
    a.sizeValue - b.sizeValue
  );
  dataPlans.set(plans);
}

async function finish(res: { error: { message: string } | null }): Promise<DbResult> {
  if (res.error) return { ok: false, error: res.error.message };
  await loadDataPlans();
  return { ok: true };
}

export async function adminAddDataPlan(input: Omit<DataPlan, 'id'>): Promise<DbResult> {
  return finish(await supabase.from('catalog_data_plans').insert({ id: newId('plan'), ...toRow(input) }));
}

export async function adminAddDataPlans(inputs: Omit<DataPlan, 'id'>[]): Promise<DbResult> {
  if (!inputs.length) return { ok: true };
  return finish(await supabase.from('catalog_data_plans').insert(inputs.map((i) => ({ id: newId('plan'), ...toRow(i) }))));
}

export async function adminUpdateDataPlan(id: string, updates: Partial<Omit<DataPlan, 'id'>>): Promise<DbResult> {
  return finish(await supabase.from('catalog_data_plans').update(toRow(updates)).eq('id', id));
}

export async function adminDeleteDataPlan(id: string): Promise<DbResult> {
  return finish(await supabase.from('catalog_data_plans').delete().eq('id', id));
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

// Add any DisCos introduced after a browser first saved its list.
discoSettings.update((list) => {
  const have = new Set(list.map((d) => d.code));
  const missing = DEFAULT_DISCOS.filter((d) => !have.has(d.code));
  return missing.length ? [...list, ...missing] : list;
});

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
export async function adminToggleDataPlan(id: string, isActive: boolean): Promise<DbResult> {
  return adminUpdateDataPlan(id, { isActive });
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
export async function adminToggleNetworkDataPlans(network: string, isActive: boolean): Promise<DbResult> {
  return finish(await supabase.from('catalog_data_plans').update({ is_active: isActive }).eq('network', network));
}

// Bulk toggle: disable/enable all plans of a specific type (SME, GIFTING, etc.)
export async function adminTogglePlanType(type: string, isActive: boolean): Promise<DbResult> {
  return finish(await supabase.from('catalog_data_plans').update({ is_active: isActive }).eq('plan_type', type));
}

// Bulk toggle: disable/enable all cable plans for a specific provider
export function adminToggleCableProvider(provider: string, isActive: boolean): void {
  cablePlans.update((list) =>
    list.map((p) => p.provider === provider ? { ...p, isActive } : p)
  );
}
