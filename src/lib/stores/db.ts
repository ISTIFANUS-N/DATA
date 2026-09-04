import { derived, get } from 'svelte/store';
import { persisted } from './persisted';
import type { Profile, Transaction, TransactionType, Beneficiary, BeneficiaryKind } from '$lib/types';

interface Account {
  profile: Profile;
  passwordHash: string | null; // null for Google accounts
  walletBalance: number;
  transactions: Transaction[];
  beneficiaries: Beneficiary[];
}

type AccountsDb = Record<string, Account>; // keyed by lowercased email

const accounts = persisted<AccountsDb>('fanu_accounts', {});
const sessionEmail = persisted<string | null>('fanu_session_email', null);

// --- Derived, read-only views used throughout the app ---

export const currentProfile = derived(
  [accounts, sessionEmail],
  ([$accounts, $sessionEmail]) => ($sessionEmail ? $accounts[$sessionEmail]?.profile ?? null : null)
);

export const isLoggedIn = derived(currentProfile, ($p) => $p !== null);

export const walletBalance = derived(
  [accounts, sessionEmail],
  ([$accounts, $sessionEmail]) => ($sessionEmail ? $accounts[$sessionEmail]?.walletBalance ?? 0 : 0)
);

export const transactions = derived(
  [accounts, sessionEmail],
  ([$accounts, $sessionEmail]) =>
    $sessionEmail
      ? [...($accounts[$sessionEmail]?.transactions ?? [])].sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
        )
      : []
);

export const beneficiaries = derived(
  [accounts, sessionEmail],
  ([$accounts, $sessionEmail]) =>
    $sessionEmail
      ? [...($accounts[$sessionEmail]?.beneficiaries ?? [])].sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
        )
      : []
);

// --- Naive local "hash" — this is a mock auth layer only. Real
// password handling happens in Supabase Auth once the backend is
// wired back in; nothing here should be mistaken for production
// security. ---
function fakeHash(pw: string) {
  return btoa(unescape(encodeURIComponent(pw)));
}

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function register(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): { ok: true } | { ok: false; error: string } {
  const email = input.email.trim().toLowerCase();
  const db = get(accounts);

  if (db[email]) return { ok: false, error: 'An account with that email already exists.' };
  if (!/^0\d{10}$/.test(input.phone)) {
    return { ok: false, error: 'Enter a valid 11-digit Nigerian phone number.' };
  }
  if (input.password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' };
  }

  const profile: Profile = {
    id: newId('user'),
    fullName: input.fullName.trim(),
    email,
    phone: input.phone,
    authProvider: 'email',
    role: 'customer'
  };

  accounts.set({
    ...db,
    [email]: {
      profile,
      passwordHash: fakeHash(input.password),
      walletBalance: 0,
      transactions: [],
      beneficiaries: []
    }
  });
  sessionEmail.set(email);
  return { ok: true };
}

export function login(
  email: string,
  password: string
): { ok: true } | { ok: false; error: string } {
  const key = email.trim().toLowerCase();
  const db = get(accounts);
  const account = db[key];

  if (!account || account.passwordHash !== fakeHash(password)) {
    return { ok: false, error: 'Incorrect email or password.' };
  }

  sessionEmail.set(key);
  return { ok: true };
}

/**
 * Stands in for Google OAuth until the backend is connected. Creates
 * (or logs into) a demo Google-style account so the flow is
 * click-through-able without a real provider yet.
 */
export function loginWithGoogleMock(): void {
  const demoEmail = 'demo.google.user@gmail.com';
  const db = get(accounts);

  if (!db[demoEmail]) {
    const profile: Profile = {
      id: newId('user'),
      fullName: 'Demo Google User',
      email: demoEmail,
      phone: '',
      authProvider: 'google',
      role: 'customer'
    };
    accounts.set({
      ...db,
      [demoEmail]: { profile, passwordHash: null, walletBalance: 0, transactions: [], beneficiaries: [] }
    });
  }

  sessionEmail.set(demoEmail);
}

export function logout(): void {
  sessionEmail.set(null);
}

/**
 * TEMPORARY: lets the frontend be browsed and used end-to-end without
 * requiring sign-up, by auto-logging into a shared local "Guest"
 * account with a starter balance. This is purely a frontend
 * convenience for previewing the app — remove the call to this in
 * +layout.svelte (and flip AUTH_REQUIRED back to true) once real
 * accounts / Supabase Auth are wired in and login should be enforced.
 */
export function ensureGuestSession(): void {
  const key = 'guest@stefanx.demo';
  const db = get(accounts);

  if (!db[key]) {
    const profile: Profile = {
      id: newId('user'),
      fullName: 'Guest',
      email: key,
      phone: '08000000000',
      authProvider: 'email',
      role: 'customer'
    };
    accounts.set({
      ...db,
      [key]: { profile, passwordHash: null, walletBalance: 5000, transactions: [], beneficiaries: [] }
    });
  }

  sessionEmail.set(key);
}

export function updatePhone(phone: string): { ok: true } | { ok: false; error: string } {
  const key = get(sessionEmail);
  if (!key) return { ok: false, error: 'Not logged in.' };
  if (!/^0\d{10}$/.test(phone)) {
    return { ok: false, error: 'Enter a valid 11-digit Nigerian phone number.' };
  }

  accounts.update((db) => {
    const account = db[key];
    if (!account) return db;
    return { ...db, [key]: { ...account, profile: { ...account.profile, phone } } };
  });
  return { ok: true };
}

// --- Wallet + transactions ---

function addTransactionForCurrentUser(tx: Transaction) {
  const key = get(sessionEmail);
  if (!key) return;
  accounts.update((db) => {
    const account = db[key];
    if (!account) return db;
    return {
      ...db,
      [key]: { ...account, transactions: [tx, ...account.transactions] }
    };
  });
}

export function fundWallet(amount: number): Transaction {
  const key = get(sessionEmail);
  const reference = newId('fund');
  const tx: Transaction = {
    id: newId('tx'),
    type: 'wallet_funding',
    status: 'success',
    amount,
    reference,
    description: 'Wallet funding',
    createdAt: new Date().toISOString()
  };

  if (key) {
    accounts.update((db) => {
      const account = db[key];
      if (!account) return db;
      return { ...db, [key]: { ...account, walletBalance: account.walletBalance + amount } };
    });
  }

  addTransactionForCurrentUser(tx);
  return tx;
}

/**
 * Mirrors the real process_wallet_debit → provider call → refund flow,
 * just synchronously and in memory. Returns the resulting transaction
 * either way so the calling page can show success/failure state.
 */
export function purchaseService(input: {
  type: TransactionType;
  amount: number;
  description: string;
  meta?: Record<string, string>;
}): { ok: true; transaction: Transaction } | { ok: false; error: string } {
  const key = get(sessionEmail);
  if (!key) return { ok: false, error: 'Not logged in.' };

  const balance = get(walletBalance);
  if (balance < input.amount) {
    return { ok: false, error: 'Insufficient wallet balance. Fund your wallet to continue.' };
  }

  const reference = newId(input.type);
  const tx: Transaction = {
    id: newId('tx'),
    type: input.type,
    status: 'success', // mock provider always "succeeds" for now
    amount: input.amount,
    reference,
    description: input.description,
    createdAt: new Date().toISOString(),
    meta: input.meta
  };

  accounts.update((db) => {
    const account = db[key];
    if (!account) return db;
    return { ...db, [key]: { ...account, walletBalance: account.walletBalance - input.amount } };
  });
  addTransactionForCurrentUser(tx);

  return { ok: true, transaction: tx };
}

// --- Beneficiaries ---

/**
 * Saves (or updates the name on) a recipient so it can be picked
 * again next time without retyping. Matches on kind+value so saving
 * the same number twice just renames it rather than duplicating it.
 */
export function saveBeneficiary(input: {
  kind: BeneficiaryKind;
  name: string;
  value: string;
  extra?: string;
}): void {
  const key = get(sessionEmail);
  if (!key) return;
  const name = input.name.trim();
  if (!name) return;

  accounts.update((db) => {
    const account = db[key];
    if (!account) return db;

    const existing = account.beneficiaries ?? [];
    const alreadySaved = existing.find((b) => b.kind === input.kind && b.value === input.value);

    const list = alreadySaved
      ? existing.map((b) => (b.id === alreadySaved.id ? { ...b, name, extra: input.extra } : b))
      : [
          {
            id: newId('ben'),
            kind: input.kind,
            name,
            value: input.value,
            extra: input.extra,
            createdAt: new Date().toISOString()
          },
          ...existing
        ];

    return { ...db, [key]: { ...account, beneficiaries: list } };
  });
}

export function removeBeneficiary(id: string): void {
  const key = get(sessionEmail);
  if (!key) return;
  accounts.update((db) => {
    const account = db[key];
    if (!account) return db;
    return {
      ...db,
      [key]: { ...account, beneficiaries: (account.beneficiaries ?? []).filter((b) => b.id !== id) }
    };
  });
}

export function isBeneficiarySaved(kind: BeneficiaryKind, value: string): boolean {
  const key = get(sessionEmail);
  if (!key) return false;
  const account = get(accounts)[key];
  return (account?.beneficiaries ?? []).some((b) => b.kind === kind && b.value === value);
}

// --- Airtime to cash ---

// The rate a customer gets for converting airtime into wallet cash —
// intentionally below 100%, matching how these services actually work
// (the platform takes a cut, since it can't resell 100%-value airtime
// for full price to someone else).
export const AIRTIME_TO_CASH_RATE = 0.85;

/**
 * Unlike a normal purchase, this doesn't move wallet money immediately
 * on submit — it can't, since nothing has actually been verified yet.
 * It records a `pending` transaction for the payout amount; crediting
 * the wallet only happens once the sent airtime is confirmed. Right
 * now (mock/local mode) that confirmation step doesn't exist yet, so
 * these sit in Transaction History as pending until that's wired up —
 * mirrors the real backend's reconcile/admin-review pattern rather
 * than faking an instant credit that wouldn't reflect how this
 * service actually has to work.
 */
export function requestAirtimeToCash(input: {
  network: string;
  amount: number;
  phoneNumber: string;
}): { ok: true; transaction: Transaction } | { ok: false; error: string } {
  const key = get(sessionEmail);
  if (!key) return { ok: false, error: 'Not logged in.' };
  if (input.amount < 200) return { ok: false, error: 'Minimum conversion amount is ₦200.' };

  const payout = Math.round(input.amount * AIRTIME_TO_CASH_RATE);
  const reference = newId('a2c');
  const tx: Transaction = {
    id: newId('tx'),
    type: 'airtime_to_cash',
    status: 'pending',
    amount: payout,
    reference,
    description: `${input.network} airtime → cash · ${input.phoneNumber}`,
    createdAt: new Date().toISOString(),
    meta: {
      network: input.network,
      phoneNumber: input.phoneNumber,
      airtimeAmount: String(input.amount),
      rate: String(AIRTIME_TO_CASH_RATE)
    }
  };

  addTransactionForCurrentUser(tx);
  return { ok: true, transaction: tx };
}
