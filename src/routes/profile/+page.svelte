<script lang="ts">
  import { goto } from '$app/navigation';
  import { currentProfile, walletBalance, logout, beneficiaries, removeBeneficiary, transactions } from '$lib/stores/db';
  import { formatNaira, formatDate } from '$lib/format';
  import { packageLabel } from '$lib/pricing';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import TransactionRow from '$lib/components/TransactionRow.svelte';
  import TransactionDetailModal from '$lib/components/TransactionDetailModal.svelte';

  import type { Transaction } from '$lib/types';
  let selectedTx: Transaction | null = null;

  function handleLogout() { logout(); goto('/login'); }
  const kindLabels = { phone: 'Phone', meter: 'Meter', smartcard: 'Smartcard' };

  $: recentTxs = $transactions.slice(0, 10);
</script>

<svelte:head><title>Profile — Stefanx Data Services</title></svelte:head>

<PageHeader title="Profile" showBack={false} />

<div class="px-4 py-5">
  <!-- User info card -->
  {#if $currentProfile}
    <div class="mb-5 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-fanu-100 font-display text-lg font-semibold text-fanu-700">
        {$currentProfile.fullName ? $currentProfile.fullName[0].toUpperCase() : '?'}
      </div>
      <div>
        <p class="font-semibold text-ink">{$currentProfile.fullName || 'Stefanx user'}</p>
        <p class="text-xs text-ink/50">{$currentProfile.email}</p>
      </div>
    </div>

    <div class="mb-5 divide-y divide-fanu-50 rounded-2xl bg-white px-4 shadow-sm">
      <div class="flex items-center justify-between py-3">
        <span class="text-sm text-ink/60">Phone number</span>
        <span class="text-sm font-medium text-ink">{$currentProfile.phone || '—'}</span>
      </div>
      <div class="flex items-center justify-between py-3">
        <span class="text-sm text-ink/60">Wallet balance</span>
        <span class="font-mono text-sm font-semibold tabular-nums text-ink">{formatNaira($walletBalance)}</span>
      </div>
      <div class="flex items-center justify-between py-3">
        <span class="text-sm text-ink/60">Account type</span>
        <span class="rounded-full bg-fanu-50 px-2.5 py-0.5 text-xs font-semibold text-fanu-700">{packageLabel($currentProfile.package)}</span>
      </div>
      <div class="flex items-center justify-between py-3">
        <span class="text-sm text-ink/60">Signed in with</span>
        <span class="text-sm font-medium capitalize text-ink">{$currentProfile.authProvider}</span>
      </div>
    </div>
  {/if}

  <!-- Transactions -->
  {#if recentTxs.length > 0}
    <div class="mb-5">
      <div class="mb-2 flex items-center justify-between">
        <p class="text-xs font-semibold uppercase tracking-wide text-ink/45">Recent transactions</p>
        <a href="/transaction-history" class="text-xs font-medium text-fanu-700 hover:underline">See all</a>
      </div>
      <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
        {#each recentTxs as tx (tx.id)}
          <TransactionRow {tx} on:view={(e) => (selectedTx = e.detail)} />
        {/each}
      </div>
    </div>
  {/if}

  <!-- Beneficiaries -->
  {#if $beneficiaries.length > 0}
    <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">Beneficiaries</p>
    <div class="mb-5 divide-y divide-fanu-50 rounded-2xl bg-white px-4 shadow-sm">
      {#each $beneficiaries as b (b.id)}
        <div class="flex items-center justify-between py-3">
          <div>
            <p class="text-sm font-medium text-ink">{b.name}</p>
            <p class="text-[11px] text-ink/45">{kindLabels[b.kind]} · {b.value}{b.extra ? ` · ${b.extra}` : ''}</p>
          </div>
          <button type="button" on:click={() => removeBeneficiary(b.id)} class="text-xs font-medium text-red-500 hover:underline">Remove</button>
        </div>
      {/each}
    </div>
  {/if}

  {#if $currentProfile?.role === 'admin'}
    <a href="/admin" class="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-white">
      Admin dashboard
    </a>
  {/if}

  <button type="button" on:click={handleLogout}
    class="w-full rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50">
    Sign out
  </button>
</div>

<TransactionDetailModal tx={selectedTx} onClose={() => (selectedTx = null)} />
