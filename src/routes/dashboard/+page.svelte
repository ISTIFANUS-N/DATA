<script lang="ts">
  import { currentProfile, walletBalance, transactions } from '$lib/stores/db';
  import WalletCard from '$lib/components/WalletCard.svelte';
  import FundWalletModal from '$lib/components/FundWalletModal.svelte';
  import TransactionRow from '$lib/components/TransactionRow.svelte';

  let fundModalOpen = false;

  const services = [
    { href: '/buy-data', label: 'Data', icon: '📶' },
    { href: '/buy-airtime', label: 'Airtime', icon: '📱' },
    { href: '/tv-subscription', label: 'Cable TV', icon: '📺' },
    { href: '/electricity-bill', label: 'Electricity', icon: '💡' },
    { href: '/airtime-to-cash', label: 'Airtime to cash', icon: '🔄' }
  ];

  $: recentTransactions = $transactions.slice(0, 5);
  $: firstName = $currentProfile?.fullName?.split(' ')[0] ?? '';
</script>

<svelte:head><title>Dashboard — Stefanx</title></svelte:head>

<div class="px-4 pt-6">
  <div class="mb-5 flex items-center justify-between">
    <div class="flex items-center gap-2.5">
      <img src="/stefanx-icon.png" alt="" class="h-8 w-8 rounded-lg" />
      <div>
        <p class="text-xs text-ink/50">Welcome back</p>
        <p class="font-display text-lg font-semibold text-ink">{firstName || 'there'}</p>
      </div>
    </div>
    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-fanu-100 font-display text-sm font-semibold text-fanu-700">
      {firstName ? firstName[0].toUpperCase() : '?'}
    </div>
  </div>

  <WalletCard balance={$walletBalance} onFund={() => (fundModalOpen = true)} />

  <div class="mt-6">
    <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/45">Services</p>
    <div class="grid grid-cols-4 gap-3 sm:grid-cols-5">
      {#each services as service}
        <a
          href={service.href}
          class="flex flex-col items-center gap-1.5 rounded-2xl bg-white py-3 text-center shadow-sm transition hover:shadow-md"
        >
          <span class="text-xl">{service.icon}</span>
          <span class="text-[11px] font-medium text-ink/80">{service.label}</span>
        </a>
      {/each}
    </div>
  </div>

  <div class="mt-6">
    <div class="mb-3 flex items-center justify-between">
      <p class="text-xs font-semibold uppercase tracking-wide text-ink/45">Recent transactions</p>
      {#if $transactions.length > 0}
        <a href="/transaction-history" class="text-xs font-medium text-spark-600">See all</a>
      {/if}
    </div>

    <div class="rounded-2xl bg-white px-4 shadow-sm">
      {#if recentTransactions.length === 0}
        <div class="py-10 text-center">
          <p class="text-2xl">🧾</p>
          <p class="mt-2 text-sm font-medium text-ink/70">No transactions yet</p>
          <p class="text-xs text-ink/40">Fund your wallet and try a purchase</p>
        </div>
      {:else}
        {#each recentTransactions as tx (tx.id)}
          <TransactionRow {tx} />
        {/each}
      {/if}
    </div>
  </div>
</div>

<FundWalletModal bind:open={fundModalOpen} />
