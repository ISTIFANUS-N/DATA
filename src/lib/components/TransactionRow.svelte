<script lang="ts">
  import type { Transaction } from '$lib/types';
  import { formatNaira, formatDate } from '$lib/format';

  export let tx: Transaction;

  const icons: Record<Transaction['type'], string> = {
    wallet_funding: '💰',
    airtime: '📱',
    data: '📶',
    electricity: '💡',
    cable: '📺',
    airtime_to_cash: '🔄',
    recharge_card_printing: '🖨️'
  };

  const labels: Record<Transaction['type'], string> = {
    wallet_funding: 'Wallet funding',
    airtime: 'Airtime',
    data: 'Data',
    electricity: 'Electricity',
    cable: 'Cable TV',
    airtime_to_cash: 'Airtime to cash',
    recharge_card_printing: 'Recharge card printing'
  };

  const statusStyles: Record<Transaction['status'], string> = {
    success: 'bg-fanu-50 text-fanu-700',
    pending: 'bg-amber-50 text-amber-700',
    failed: 'bg-red-50 text-red-700'
  };

  $: isCredit = tx.type === 'wallet_funding' || tx.type === 'airtime_to_cash';
</script>

<div class="flex items-center gap-3 border-b border-fanu-50 py-3 last:border-0">
  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fanu-50 text-lg">
    {icons[tx.type]}
  </div>
  <div class="min-w-0 flex-1">
    <p class="truncate text-sm font-medium text-ink">{tx.description || labels[tx.type]}</p>
    <p class="text-[11px] text-ink/45">{formatDate(tx.createdAt)} · {tx.reference}</p>
  </div>
  <div class="text-right">
    <p class="font-mono text-sm font-semibold tabular-nums" class:text-fanu-600={isCredit} class:text-ink={!isCredit}>
      {isCredit ? '+' : '-'}{formatNaira(tx.amount)}
    </p>
    <span class="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize {statusStyles[tx.status]}">
      {tx.status}
    </span>
  </div>
</div>
