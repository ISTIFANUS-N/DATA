<script lang="ts">
  import { transactions } from '$lib/stores/db';
  import TransactionRow from '$lib/components/TransactionRow.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import type { TransactionType } from '$lib/types';

  const filters: { value: TransactionType | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'wallet_funding', label: 'Funding' },
    { value: 'airtime', label: 'Airtime' },
    { value: 'data', label: 'Data' },
    { value: 'electricity', label: 'Electricity' },
    { value: 'cable', label: 'Cable' },
    { value: 'airtime_to_cash', label: 'Airtime to cash' }
  ];

  let activeFilter: TransactionType | 'all' = 'all';

  $: filtered =
    activeFilter === 'all' ? $transactions : $transactions.filter((t) => t.type === activeFilter);
</script>

<svelte:head><title>Transaction history — Stefanx</title></svelte:head>

<PageHeader title="Transaction history" showBack={false} />

<div class="px-4 py-4">
  <div class="mb-4 flex gap-2 overflow-x-auto pb-1">
    {#each filters as f}
      <button
        type="button"
        on:click={() => (activeFilter = f.value)}
        class="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition"
        class:border-fanu-500={activeFilter === f.value}
        class:bg-fanu-600={activeFilter === f.value}
        class:text-white={activeFilter === f.value}
        class:border-fanu-100={activeFilter !== f.value}
        class:text-ink={activeFilter !== f.value}
      >
        {f.label}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl bg-white px-4 shadow-sm">
    {#if filtered.length === 0}
      <div class="py-12 text-center">
        <p class="text-2xl">🧾</p>
        <p class="mt-2 text-sm font-medium text-ink/70">No transactions here yet</p>
      </div>
    {:else}
      {#each filtered as tx (tx.id)}
        <TransactionRow {tx} />
      {/each}
    {/if}
  </div>
</div>
