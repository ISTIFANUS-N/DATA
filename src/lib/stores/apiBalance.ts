import { writable, derived } from 'svelte/store';
import { persisted } from './persisted';

// The threshold below which the low-balance alert fires, in Naira.
// In production this would be a configurable value the admin sets.
export const API_BALANCE_THRESHOLD = 5000;

export interface ApiBalance {
  balance: number;
  lastChecked: string; // ISO timestamp
  provider: string;
}

// Simulated VTU provider API balance. In production this would be
// fetched from a real provider endpoint via an Edge Function, then
// written here for the frontend to read. The mock starts at a healthy
// amount but can be manually set from the admin UI for testing.
export const apiBalance = persisted<ApiBalance>('fanu_api_balance', {
  balance: 8500,
  lastChecked: new Date().toISOString(),
  provider: 'Stefanx VTU Provider'
});

export const isApiBalanceLow = derived(
  apiBalance,
  ($b) => $b.balance < API_BALANCE_THRESHOLD
);

// Tracks whether the current admin session has already dismissed
// the low-balance banner (resets when balance goes back above threshold).
export const balanceAlertDismissed = writable(false);
isApiBalanceLow.subscribe((low) => {
  if (!low) balanceAlertDismissed.set(false);
});

export function refreshApiBalance(): void {
  // Mock: simulates a balance check against the VTU provider API.
  // Production: call the provider's balance endpoint via fetch.
  apiBalance.update((b) => ({
    ...b,
    lastChecked: new Date().toISOString()
  }));
}

// For testing: lets the admin manually set the simulated balance.
export function setMockApiBalance(amount: number): void {
  apiBalance.update((b) => ({
    ...b,
    balance: amount,
    lastChecked: new Date().toISOString()
  }));
}
