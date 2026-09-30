<script lang="ts">
  import { formatNaira } from '$lib/format';
  export let balance: number;
  export let onFund: () => void;
  export let accountNumber: string = '';
  export let accountName: string = '';
  export let bankName: string = '';
  export let onCopy: () => void = () => {};
  export let copied = false;
  // Kept so existing callers don't break; the card no longer shows the package badge.
  export let package_: string = 'smart_user';

  // 0123456789 -> 0123 456 789 (easier to read and dictate)
  $: spaced = accountNumber.replace(/(\d{4})(?=\d)/, '$1 ').replace(/(\d{3})(?=\d)/g, '$1 ').trim();
</script>

<div class="relative rounded-card bg-fanu-600 px-5 pt-5 pb-5 text-white shadow-lg shadow-fanu-900/10">
  <!-- Top row: balance + Fund -->
  <div class="flex items-start justify-between">
    <div>
      <p class="flex items-center gap-2 text-sm font-medium text-white/85">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
        Wallet balance
      </p>
      <p class="mt-2 font-mono text-[34px] font-bold tabular-nums leading-none">
        {formatNaira(balance)}
      </p>
    </div>
    <button
      type="button"
      on:click={onFund}
      class="shrink-0 rounded-xl bg-spark-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-spark-600 active:scale-95"
    >
      + Fund
    </button>
  </div>

  <!-- Dashed divider -->
  <div class="relative my-4 border-t border-dashed border-white/25">
    <!-- Ticket notches: page-colour circles cut into the card edges (px-5 = 20px padding) -->
    <span class="absolute -left-[30px] -top-2.5 h-5 w-5 rounded-full bg-paper"></span>
    <span class="absolute -right-[30px] -top-2.5 h-5 w-5 rounded-full bg-paper"></span>
  </div>

  <!-- Footer: funding account, or tagline while none exists -->
  {#if accountNumber}
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate text-[11px] text-white/65">
          {bankName}{accountName ? ` · ${accountName}` : ''}
        </p>
        <p class="mt-0.5 font-mono text-xl font-bold tracking-wider text-white">{spaced}</p>
      </div>
      <button type="button" on:click={onCopy}
        class="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/25 active:scale-95">
        {#if copied}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          Copied
        {:else}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
          Copy
        {/if}
      </button>
    </div>
  {:else}
    <p class="text-sm text-white/70">One wallet. Airtime, data, electricity, cable.</p>
  {/if}
</div>
