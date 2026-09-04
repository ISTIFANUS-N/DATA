<script lang="ts">
  import { formatNaira } from '$lib/format';

  export let title: string;
  export let rows: { label: string; value: string }[];
  export let amount: number;
  export let amountLabel = 'Amount';
  export let confirmLabel = 'Confirm & Pay';
  export let submitting = false;
  export let error = '';
  export let onConfirm: () => void;
  export let onBack: () => void;
</script>

<div class="px-4 py-5">
  <div class="mb-5 rounded-2xl bg-white p-5 text-center shadow-sm">
    <p class="text-xs font-medium uppercase tracking-wide text-ink/45">{title}</p>
    <p class="mt-2 font-mono text-3xl font-semibold tabular-nums text-fanu-700">
      {formatNaira(amount)}
    </p>
    <p class="mt-1 text-xs text-ink/40">{amountLabel}</p>
  </div>

  <div class="mb-5 divide-y divide-fanu-50 rounded-2xl bg-white px-4 shadow-sm">
    {#each rows as row}
      <div class="flex items-center justify-between py-3">
        <span class="text-sm text-ink/55">{row.label}</span>
        <span class="text-sm font-medium text-ink">{row.value}</span>
      </div>
    {/each}
  </div>

  {#if error}
    <p class="mb-3 text-sm text-red-600">{error}</p>
  {/if}

  <div class="flex gap-2.5">
    <button
      type="button"
      on:click={onBack}
      disabled={submitting}
      class="flex-1 rounded-xl border border-fanu-100 py-3.5 text-sm font-semibold text-ink/70 transition hover:bg-fanu-50 disabled:opacity-50"
    >
      Edit
    </button>
    <button
      type="button"
      on:click={onConfirm}
      disabled={submitting}
      class="flex-[2] rounded-xl bg-spark-500 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-spark-600 disabled:opacity-60"
    >
      {submitting ? 'Processing…' : confirmLabel}
    </button>
  </div>
</div>
