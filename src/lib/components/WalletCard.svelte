<script lang="ts">
  import { formatNaira } from '$lib/format';
  export let balance: number;
  export let onFund: () => void;
</script>

<div class="relative overflow-visible rounded-card bg-fanu-600 px-5 pt-5 pb-6 text-white shadow-lg shadow-fanu-900/10">
  <!-- ticket-stub notches -->
  <span class="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-paper"></span>
  <span class="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-paper"></span>

  <div class="flex items-start justify-between">
    <div>
      <p class="flex items-center gap-1.5 text-[13px] font-medium text-fanu-50/90">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
        Wallet balance
      </p>
      <p class="mt-2 font-mono text-[28px] font-semibold tabular-nums leading-none">
        {formatNaira(balance)}
      </p>
    </div>
    <button
      type="button"
      on:click={onFund}
      class="rounded-lg bg-spark-500 px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-spark-600"
    >
      + Fund
    </button>
  </div>

  <div class="mt-5 border-t border-dashed border-white/25 pt-3">
    <p class="text-[11px] text-fanu-50/70">One wallet. Airtime, data, electricity, cable.</p>
  </div>
</div>
