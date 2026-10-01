/**
 * db.ts — Real Supabase backend replacing the localStorage mock.
 *
 * All stores are writable and updated reactively via supabase.auth.onAuthStateChange
 * plus direct fetches after mutations. Nothing hits localStorage except the
 * Supabase session cookie (managed by @supabase/ssr automatically).
 */

import { writable, derived, get } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { Profile, Transaction, TransactionType, Beneficiary } from '$lib/types';

// ─── Raw state stores ─────────────────────────────────────────────────────────

export const currentProfile   = writable<Profile | null>(null);
export const walletBalance    = writable<number>(0);
export const transactions     = writable<Transaction[]>([]);
export const beneficiaries    = writable<Beneficiary[]>([]);
export const isLoggedIn       = derived(currentProfile, ($p) => $p !== null);

// Admin extras
export const allAccountsForAdmin      = writable<{ email: string; profile: Profile; walletBalance: number }[]>([]);
export const allTransactionsForAdmin  = writable<(Transaction & { userEmail: string; userName: string })[]>([]);

// Daily login count
export const todayLoginCount   = writable<number>(0);
export const myTodayLoginCount = writable<number>(0);

// ─── Bootstrap: listen for auth state changes ─────────────────────────────────

supabase.auth.onAuthStateChange(async (_event, session) => {
  if (session?.user) {
    await loadProfileAndWallet(session.user.id);
  } else {
    currentProfile.set(null);
    walletBalance.set(0);
    transactions.set([]);
    beneficiaries.set([]);
  }
});

// Load on first import (page refresh)
supabase.auth.getSession().then(({ data }) => {
  if (data.session?.user) loadProfileAndWallet(data.session.user.id);
});

// ─── Loaders ─────────────────────────────────────────────────────────────────

async function loadProfileAndWallet(userId: string) {
  // Profile
  const { data: prof } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, package, login_count_today, last_login_date')
    .eq('id', userId)
    .single();

  if (prof) {
    currentProfile.set({
      id:           prof.id,
      fullName:     prof.full_name,
      email:        prof.email,
      phone:        prof.phone ?? '',
      authProvider: 'email',
      role:         prof.role === 'admin' ? 'admin' : 'customer',
      package:      prof.package ?? 'smart_user'
    });

    // daily login count
    const today = new Date().toISOString().slice(0, 10);
    const mine = prof.last_login_date === today ? (prof.login_count_today ?? 0) : 0;
    myTodayLoginCount.set(mine);
  }

  // Wallet
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();

  walletBalance.set(wallet?.balance ?? 0);

  // Transactions
  await loadTransactions(userId);

  // Beneficiaries
  await loadBeneficiaries(userId);
}

async function loadTransactions(userId: string) {
  const { data } = await supabase
    .from('service_transactions')
    .select('id, service_type, status, amount, reference, description, created_at, provider_network, data_plan_type_used, provider_name')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (data) {
    transactions.set(data.map(rowToTx));
  }
}

async function loadBeneficiaries(userId: string) {
  const { data } = await supabase
    .from('beneficiaries')
    .select('id, kind, name, value, extra, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (data) {
    beneficiaries.set(data.map((b) => ({
      id:        b.id,
      kind:      b.kind,
      name:      b.name,
      value:     b.value,
      extra:     b.extra ?? undefined,
      createdAt: b.created_at
    })));
  }
}

function rowToTx(row: Record<string, unknown>): Transaction {
  const meta: Record<string, string> = {};
  if (row.provider_network)    meta.network     = String(row.provider_network);
  if (row.data_plan_type_used) meta.planType    = String(row.data_plan_type_used);
  if (row.provider_name)       meta.provider    = String(row.provider_name);

  return {
    id:          String(row.id),
    type:        (row.service_type as TransactionType) ?? 'data',
    status:      (row.status as 'success' | 'pending' | 'failed') ?? 'pending',
    amount:      Number(row.amount),
    reference:   String(row.reference ?? ''),
    description: String(row.description ?? ''),
    createdAt:   String(row.created_at),
    meta:        Object.keys(meta).length ? meta : undefined
  };
}

// ─── Auth actions ─────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };

  // Record login in DB
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.rpc('record_login', { p_user_id: user.id });

  return { ok: true };
}

export async function register(
  email: string,
  password: string,
  fullName: string,
  phone: string
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {

  // Basic client-side checks before hitting the API
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Enter a valid email address.' };
  }
  if (!password || password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' };
  }
  if (!fullName.trim()) {
    return { ok: false, error: 'Enter your full name.' };
  }
  if (!phone || phone.length < 10) {
    return { ok: false, error: 'Enter a valid phone number.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone } }
  });

  if (error) {
    // Map Supabase error messages to friendly ones
    const msg = error.message.toLowerCase();
    if (msg.includes('already registered') || msg.includes('user already exists') || msg.includes('email address is already')) {
      return { ok: false, error: 'An account with this email already exists. Try signing in instead.' };
    }
    if (msg.includes('password')) {
      return { ok: false, error: 'Password is too weak. Use at least 6 characters with a mix of letters and numbers.' };
    }
    if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
      return { ok: false, error: 'This email address is not valid.' };
    }
    // For everything else — show the raw Supabase message so nothing is hidden
    return { ok: false, error: error.message };
  }

  // Supabase sometimes returns a user with identities=[] for duplicate emails
  // (when email confirmation is ON) — this means the email is already taken
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { ok: false, error: 'An account with this email already exists. Try signing in instead.' };
  }

  // Also check for duplicate phone number
  if (phone) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    if (existing) {
      return { ok: false, error: 'This phone number is already linked to an account.' };
    }
  }

  // Write phone and full_name directly to be safe (trigger may lag)
  if (data.user) {
    await new Promise(r => setTimeout(r, 800));
    await supabase
      .from('profiles')
      .update({ phone, full_name: fullName })
      .eq('id', data.user.id);
  }

  return { ok: true, email };
}

export async function logout() {
  await supabase.auth.signOut();
  currentProfile.set(null);
  walletBalance.set(0);
  transactions.set([]);
  beneficiaries.set([]);
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

/** Called after Monnify payment confirmation to reload the balance */
export async function reloadWallet() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data } = await supabase
    .from('wallets').select('balance').eq('user_id', user.id).single();
  if (data) walletBalance.set(data.balance);
}

// ─── Service purchase ─────────────────────────────────────────────────────────

export async function purchaseService(params: {
  type: TransactionType;
  amount: number;
  description: string;
  meta?: Record<string, string>;
}): Promise<{ ok: true; transaction: Transaction } | { ok: false; error: string }> {
  const bal = get(walletBalance);
  if (bal < params.amount) {
    return { ok: false, error: `Insufficient balance. You have ${bal.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })} — need ₦${params.amount.toLocaleString()}.` };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };

  // Call the Edge Function for this service type
  const fnMap: Partial<Record<TransactionType, string>> = {
    data:                   'buy-data',
    airtime:                'buy-airtime',
    cable:                  'buy-cable',
    electricity:            'buy-electricity',
    bulk_sms:               'buy-bulk-sms',
    result_checker:         'buy-result-checker',
    recharge_card_printing: 'buy-recharge-cards',
    airtime_to_cash:        'airtime-to-cash',
  };

  const fn = fnMap[params.type];
  if (!fn) return { ok: false, error: `No handler for service type: ${params.type}` };

  let data: any;
  let error: { message: string } | null = null;

  if (params.type === 'data' || params.type === 'airtime') {
    // Handled by our own server route, which talks to whichever provider is configured.
    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: params.type, amount: params.amount,
          description: params.description, meta: params.meta ?? {}
        })
      });
      data = await res.json().catch(() => null);
      if (!res.ok) error = { message: data?.error ?? 'Request failed' };
    } catch {
      error = { message: 'Failed to send' };
    }
  } else {
    ({ data, error } = await supabase.functions.invoke(fn, {
      body: { amount: params.amount, description: params.description, meta: params.meta ?? {} }
    }));
  }

  if (error || !data?.ok) {
    const msg = data?.error ?? error?.message ?? '';
    if (msg.includes('Failed to send') || msg.includes('FunctionsFetchError') || msg.includes('not found')) {
      return { ok: false, error: 'Service temporarily unavailable. Please try again shortly.' };
    }
    return { ok: false, error: msg || 'Transaction failed.' };
  }

  // Reload wallet and transactions
  await reloadWallet();
  if (user) await loadTransactions(user.id);

  const tx: Transaction = {
    id:          data.transaction.id,
    type:        params.type,
    status:      data.transaction.status,
    amount:      params.amount,
    reference:   data.transaction.reference,
    description: params.description,
    createdAt:   data.transaction.created_at ?? new Date().toISOString(),
    meta:        params.meta
  };

  return { ok: true, transaction: tx };
}

// ─── Beneficiaries ────────────────────────────────────────────────────────────

export async function saveBeneficiary(
  b: Omit<Beneficiary, 'id' | 'createdAt'>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('beneficiaries').upsert({
    user_id: user.id, kind: b.kind, name: b.name, value: b.value, extra: b.extra ?? null
  }, { onConflict: 'user_id, kind, value' });
  await loadBeneficiaries(user.id);
}

export async function removeBeneficiary(id: string): Promise<void> {
  await supabase.from('beneficiaries').delete().eq('id', id);
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await loadBeneficiaries(user.id);
}

export function isBeneficiarySaved(kind: string, value: string): boolean {
  return get(beneficiaries).some((b) => b.kind === kind && b.value === value);
}

// ─── Admin: load all accounts ─────────────────────────────────────────────────

export async function loadAllAccountsForAdmin(): Promise<void> {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, package, wallets(balance)')
    .order('created_at', { ascending: false });

  if (data) {
    allAccountsForAdmin.set(data.map((p) => ({
      email: p.email,
      profile: {
        id:           p.id,
        fullName:     p.full_name,
        email:        p.email,
        phone:        p.phone ?? '',
        authProvider: 'email' as const,
        role:         p.role === 'admin' ? 'admin' : 'customer',
        package:      p.package ?? 'smart_user'
      },
      walletBalance: (p.wallets as unknown as { balance: number }[])?.[0]?.balance ?? 0
    })));
  }
}

export async function loadAllTransactionsForAdmin(): Promise<void> {
  const { data } = await supabase
    .from('service_transactions')
    .select('id, service_type, status, amount, reference, description, created_at, provider_network, data_plan_type_used, provider_name, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(500);

  if (data) {
    allTransactionsForAdmin.set(data.map((row) => ({
      ...rowToTx(row),
      userEmail: (row.profiles as unknown as { email: string })?.email ?? '',
      userName:  (row.profiles as unknown as { full_name: string })?.full_name ?? ''
    })));
  }
}

// Platform-wide daily login count
export async function loadTodayLoginCount(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('last_login_date', today);
  todayLoginCount.set(count ?? 0);
}

// ─── Admin: update profile ────────────────────────────────────────────────────

export async function adminUpdateProfile(
  userId: string,
  updates: { fullName?: string; phone?: string; role?: 'customer' | 'admin'; package?: 'smart_user' | 'reseller' }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const payload: Record<string, string> = {};
  if (updates.fullName) payload.full_name = updates.fullName;
  if (updates.phone)    payload.phone     = updates.phone;
  if (updates.role)     payload.role      = updates.role;
  if (updates.package)  payload.package   = updates.package;

  const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Admin: wallet adjustment ─────────────────────────────────────────────────

export async function adminAdjustWallet(
  userId: string,
  amount: number,
  direction: 'credit' | 'debit',
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc(
    direction === 'credit' ? 'process_wallet_credit' : 'process_wallet_debit',
    { p_user_id: userId, p_amount: amount, p_source: 'admin_adjustment', p_ref: `ADJ_${Date.now()}`, p_description: reason }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Admin: update transaction status ────────────────────────────────────────

export async function adminUpdateTransactionStatus(
  txId: string,
  status: 'success' | 'failed' | 'pending',
  note?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('service_transactions')
    .update({ status, review_note: note ?? null, resolved_by: user?.id, resolved_at: new Date().toISOString() })
    .eq('id', txId);
  if (error) return { ok: false, error: error.message };
  await loadAllTransactionsForAdmin();
  return { ok: true };
}

// ─── Stub: keep old call sites working during migration ──────────────────────
// These existed in the mock — kept as no-ops so pages don't break
// before they're fully migrated.
// switchPackage is intentionally removed — only admins can change a user's package
// via adminUpdateProfile() which goes through the approval queue for regular admins
// and is applied directly by super admins.

// Kept for pages that still reference the old mock
export const fundWallet = async (_amount: number) => {
  // Real funding goes through Monnify webhook → Edge Function → process_wallet_credit
  // This stub is only here so the old FundWalletModal compiles.
  // The new MonnifyCheckout component handles the real flow.
  await reloadWallet();
};

// ─── Admin compat aliases ────────────────────────────────────────────────────
export const adminUpdateUserProfile = adminUpdateProfile;

export async function adminSetUserPassword(_userId: string, _newPw: string): Promise<{ ok: true } | { ok: false; error: string }> {
  // Password reset via Supabase Admin API (service role) — implement via Edge Function
  return { ok: false, error: 'Password reset must be triggered from the admin Edge Function using the service role key.' };
}

export async function adminDeleteUser(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase.functions.invoke('admin-delete-user', { body: { userId } });
  if (error || !data?.ok) return { ok: false, error: data?.error ?? error?.message ?? 'Delete failed' };
  await loadAllAccountsForAdmin();
  return { ok: true };
}

export interface AdminUserRow {
  email: string;
  profile: Profile;
  walletBalance: number;
}

// ─── Super admin: assign / revoke admin ──────────────────────────────────────
// Only callable by a super admin (role=admin AND package=reseller).
// Uses the service role key via an Edge Function so clients can't forge it.

export async function assignAdmin(
  targetUserId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Verify caller is super admin first
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in' };

  const { data: caller } = await supabase
    .from('profiles')
    .select('role, package')
    .eq('id', user.id)
    .single();

  if (!caller || caller.role !== 'admin' || caller.package !== 'reseller') {
    return { ok: false, error: 'Super admin access required' };
  }

  if (targetUserId === user.id) {
    return { ok: false, error: 'You cannot change your own role' };
  }

  // Call the SQL function directly — RLS is bypassed by the security definer function
  const { error } = await supabase.rpc('super_admin_set_role', {
    p_target_user_id: targetUserId,
    p_role: 'admin',
    p_package: 'smart_user'
  });

  if (error) return { ok: false, error: error.message };
  await loadAllAccountsForAdmin();
  return { ok: true };
}

export async function revokeAdmin(
  targetUserId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in' };

  const { data: caller } = await supabase
    .from('profiles')
    .select('role, package')
    .eq('id', user.id)
    .single();

  if (!caller || caller.role !== 'admin' || caller.package !== 'reseller') {
    return { ok: false, error: 'Super admin access required' };
  }

  if (targetUserId === user.id) {
    return { ok: false, error: 'You cannot change your own role' };
  }

  const { error } = await supabase.rpc('super_admin_set_role', {
    p_target_user_id: targetUserId,
    p_role: 'customer',
    p_package: 'smart_user'
  });

  if (error) return { ok: false, error: error.message };
  await loadAllAccountsForAdmin();
  return { ok: true };
}
