<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Transaction } from '$lib/types';
  import { formatNaira, formatDate } from '$lib/format';

  export let tx: Transaction & { userEmail?: string; userName?: string };
  export let clickable = true;

  const dispatch = createEventDispatcher<{ view: typeof tx }>();

  const icons: Record<Transaction['type'], string> = {
    wallet_funding: '💰', airtime: '📱', data: '📶', electricity: '💡', cable: '📺',
    airtime_to_cash: '🔄', recharge_card_printing: '🖨️', bulk_sms: '💬',
    result_checker: '📋', admin_adjustment: '🛠️'
  };

  const labels: Record<Transaction['type'], string> = {
    wallet_funding: 'Wallet funding', airtime: 'Airtime', data: 'Data',
    electricity: 'Electricity', cable: 'Cable TV', airtime_to_cash: 'Airtime to cash',
    recharge_card_printing: 'Recharge card printing', bulk_sms: 'Bulk SMS',
    result_checker: 'Result checker', admin_adjustment: 'Admin adjustment'
  };

  const statusStyles: Record<Transaction['status'], string> = {
    success: 'bg-fanu-50 text-fanu-700',
    pending: 'bg-amber-50 text-amber-700',
    failed: 'bg-red-50 text-red-700'
  };

  $: isCredit =
    tx.type === 'wallet_funding' ||
    tx.type === 'airtime_to_cash' ||
    (tx.type === 'admin_adjustment' && tx.meta?.direction === 'credit');
</script>

<button
  type="button"
  class="flex w-full items-center gap-3 border-b border-fanu-50 py-3 text-left last:border-0 transition"
  class:hover:bg-fanu-50={clickable}
  class:cursor-pointer={clickable}
  class:cursor-default={!clickable}
  on:click={() => clickable && dispatch('view', tx)}
>
  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fanu-50 text-lg">
    {icons[tx.type]}
  </div>
  <div class="min-w-0 flex-1">
    <p class="truncate text-sm font-medium text-ink">{tx.description || labels[tx.type]}</p>
    <p class="text-[11px] text-ink/45">{formatDate(tx.createdAt)}</p>
  </div>
  <div class="flex shrink-0 flex-col items-end gap-0.5">
    <p class="font-mono text-sm font-semibold tabular-nums"
      class:text-fanu-600={isCredit} class:text-ink={!isCredit}>
      {isCredit ? '+' : '-'}{formatNaira(tx.amount)}
    </p>
    <span class="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize {statusStyles[tx.status]}">
      {tx.status}
    </span>
  </div>
  {#if clickable}
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-ink/25">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  {/if}
</button>
