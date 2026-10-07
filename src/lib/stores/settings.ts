import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import { DEFAULT_AIRTIME_CASHBACK, type AirtimeCashback } from '$lib/pricing';
import { DATA_PLAN_TYPES } from '$lib/data/catalog';

// Shared settings live in the app_settings table (see supabase/app_settings.sql),
// so what an admin saves reaches every user — unlike the browser-local admin stores.

export interface DashboardNotice {
  enabled: boolean;
  message: string;
  tone: 'info' | 'success' | 'warning';
  updatedAt?: string;
}

export interface WelcomeSuggestion {
  enabled: boolean;
  title: string;
  message: string;
}

export const DEFAULT_NOTICE: DashboardNotice = { enabled: false, message: '', tone: 'info' };

export const DEFAULT_SUGGESTION: WelcomeSuggestion = {
  enabled: true,
  title: 'Tip: get your funding account',
  message: 'Get your own account number to fund your wallet instantly by bank transfer. It only takes a minute.'
};

export const dashboardNotice = writable<DashboardNotice>(DEFAULT_NOTICE);
export const welcomeSuggestion = writable<WelcomeSuggestion>(DEFAULT_SUGGESTION);
export const airtimeCashback = writable<AirtimeCashback>(DEFAULT_AIRTIME_CASHBACK);
export interface PlanTypeDef { code: string; label: string; blurb?: string }

/** The data plan types, with the names admins gave them (falls back to the starting set). */
export const planTypes = writable<PlanTypeDef[]>(DATA_PLAN_TYPES);

/** A new unique type code from a name, e.g. "Direct Data" -> DIRECT_DATA. */
export function makePlanTypeCode(label: string, taken: string[]): string {
  const base = label.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'TYPE';
  let code = base;
  let n = 2;
  while (taken.includes(code)) code = `${base}_${n++}`;
  return code;
}

export function planTypeLabel(defs: PlanTypeDef[], code: string): string {
  return defs.find((d) => d.code === code)?.label ?? code;
}

/** Which data plan types customers can see. A type that is missing counts as on. */
export const dataPlanTypes = writable<Record<string, boolean>>({});
export const settingsLoaded = writable(false);

export async function loadSettings(): Promise<void> {
  const { data } = await supabase.from('app_settings').select('key, value');
  const byKey = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));

  dashboardNotice.set({ ...DEFAULT_NOTICE, ...(byKey.dashboard_notice ?? {}) });
  welcomeSuggestion.set({ ...DEFAULT_SUGGESTION, ...(byKey.welcome_suggestion ?? {}) });

  const cashback: AirtimeCashback = {};
  for (const net of Object.keys(DEFAULT_AIRTIME_CASHBACK)) {
    cashback[net] = { ...DEFAULT_AIRTIME_CASHBACK[net], ...(byKey.airtime_cashback?.[net] ?? {}) };
  }
  airtimeCashback.set(cashback);
  dataPlanTypes.set({ ...(byKey.data_plan_types ?? {}) });
  const defs = byKey.data_plan_type_defs;
  planTypes.set(Array.isArray(defs) && defs.length ? defs : DATA_PLAN_TYPES);
  settingsLoaded.set(true);
}

/** Admin only (enforced by RLS). */
export async function saveSetting(
  key: 'dashboard_notice' | 'welcome_suggestion' | 'airtime_cashback' | 'data_plan_types' | 'data_plan_type_defs',
  value: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('app_settings').upsert({
    key, value, updated_at: new Date().toISOString(), updated_by: user?.id ?? null
  });
  if (error) return { ok: false, error: error.message };
  await loadSettings();
  return { ok: true };
}
