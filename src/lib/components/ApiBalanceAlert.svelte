<script lang="ts">
  import {
    apiBalance,
    isApiBalanceLow,
    balanceAlertDismissed,
    API_BALANCE_THRESHOLD,
    refreshApiBalance
  } from '$lib/stores/apiBalance';
  import { formatNaira } from '$lib/format';

  export let compact = false; // true inside the admin layout (less padding)
</script>

{#if $isApiBalanceLow && !$balanceAlertDismissed}
  <div
    class="flex items-start gap-3 px-4 py-3 text-sm"
    class:bg-amber-50={true}
    style="border-bottom: 0.5px solid #FAC775;"
    role="alert"
  >
    <span class="mt-0.5 text-base">⚠️</span>
    <div class="flex-1 min-w-0">
      <p class="text-xs font-semibold text-amber-800">
        Low VTU provider balance
      </p>
      <p class="text-[11px] text-amber-700 mt-0.5">
        Current balance: <strong>{formatNaira($apiBalance.balance)}</strong>
        — below the ₦{API_BALANCE_THRESHOLD.toLocaleString()} threshold.
        Top up your VTU provider account to avoid service interruptions.
      </p>
      <p class="text-[10px] text-amber-600 mt-1">
        Last checked: {new Date($apiBalance.lastChecked).toLocaleString('en-NG')}
      </p>
    </div>
    <div class="flex flex-col gap-1.5 shrink-0">
      <button
        type="button"
        on:click={refreshApiBalance}
        class="text-[11px] font-medium text-amber-700 hover:underline"
      >
        Refresh
      </button>
      <button
        type="button"
        on:click={() => balanceAlertDismissed.set(true)}
        class="text-[11px] font-medium text-amber-600 hover:underline"
      >
        Dismiss
      </button>
    </div>
  </div>
{/if}
