<script lang="ts">
  import { showToast } from '$lib/stores/toast';

  export let status: 'success' | 'failed';
  export let title: string;
  export let subtitle: string;
  export let rows: { label: string; value: string; emphasis?: boolean }[];
  export let reference: string;
  export let shareText: string;
  export let onDone: () => void;
  export let onBuyAgain: (() => void) | undefined = undefined;
  export let onRetry: (() => void) | undefined = undefined;
  export let retrying = false;

  async function handleCopyReference() {
    try {
      await navigator.clipboard.writeText(reference);
      showToast('Reference copied');
    } catch {
      // clipboard can be blocked in some environments — non-critical
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText });
      } catch {
        // user cancelled the share sheet — not an error
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareText);
      showToast('Receipt copied — paste it anywhere to share');
    } catch {
      showToast('Could not share automatically — copy the details manually');
    }
  }

  function handleRetry() {
    onRetry?.();
  }
</script>

<div class="px-4 py-8">
  <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-3xl text-white"
    class:bg-fanu-600={status === 'success'}
    class:bg-red-500={status === 'failed'}
  >
    {status === 'success' ? '✓' : '✕'}
  </div>

  <p class="text-center font-display text-lg font-bold text-ink">{title}</p>
  <p class="mx-auto mt-1 max-w-xs text-center text-sm text-ink/50">{subtitle}</p>

  {#if status === 'failed'}
    <div class="mx-auto mt-5 flex max-w-sm items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs text-red-700">
      <span class="mt-px">⚠</span>
      <span>Your wallet was not charged for this failed transaction.</span>
    </div>
  {/if}

  <div class="mx-auto mt-5 max-w-sm divide-y divide-fanu-50 rounded-2xl bg-white px-4 shadow-sm">
    {#each rows as row}
      <div class="flex items-center justify-between py-3">
        <span class="text-sm text-ink/55">{row.label}</span>
        <span
          class="text-sm font-medium"
          class:text-fanu-700={row.emphasis}
          class:text-ink={!row.emphasis}
        >
          {row.value}
        </span>
      </div>
    {/each}
    <div class="flex items-center justify-between py-3">
      <span class="text-sm text-ink/55">Reference</span>
      <button type="button" on:click={handleCopyReference} class="flex items-center gap-1.5 text-sm font-medium text-ink">
        <span class="font-mono">{reference}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-ink/35">
          <rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
      </button>
    </div>
  </div>

  <div class="mx-auto mt-6 flex max-w-sm flex-col gap-2.5">
    {#if status === 'success'}
      <button
        type="button"
        on:click={onDone}
        class="w-full rounded-xl bg-fanu-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-fanu-700"
      >
        Done
      </button>
      <div class="flex gap-2.5">
        {#if onBuyAgain}
          <button
            type="button"
            on:click={onBuyAgain}
            class="flex-1 rounded-xl border border-fanu-100 py-3 text-sm font-semibold text-ink/70 transition hover:bg-fanu-50"
          >
            Buy Again
          </button>
        {/if}
        <button
          type="button"
          on:click={handleShare}
          class="flex-1 rounded-xl border border-fanu-100 py-3 text-sm font-semibold text-ink/70 transition hover:bg-fanu-50"
        >
          Share Receipt
        </button>
      </div>
    {:else}
      <button
        type="button"
        on:click={handleRetry}
        disabled={!onRetry || retrying}
        class="w-full rounded-xl bg-fanu-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-fanu-700 disabled:opacity-60"
      >
        {retrying ? 'Retrying…' : 'Try Again'}
      </button>
      <a
        href="mailto:support@stefanx.ng?subject=Transaction%20issue%20—%20{reference}"
        class="w-full rounded-xl border border-fanu-100 py-3 text-center text-sm font-semibold text-ink/70 transition hover:bg-fanu-50"
      >
        Contact Support
      </a>
    {/if}
  </div>
</div>
