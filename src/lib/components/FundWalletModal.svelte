<script lang="ts">
  import { fundWallet } from '$lib/stores/db';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira } from '$lib/format';

  export let open = false;

  const presets = [1000, 2000, 5000, 10000];
  let amount: number | null = null;
  let loading = false;

  function close() {
    open = false;
    amount = null;
  }

  function submit() {
    if (!amount || amount < 100) return;
    loading = true;
    // Simulated gateway delay — in the real flow this is a redirect
    // to Paystack/Flutterwave, then a webhook credits the wallet.
    setTimeout(() => {
      fundWallet(amount!);
      loading = false;
      showToast(`Wallet funded with ${formatNaira(amount!)}`);
      close();
    }, 500);
  }
</script>

{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" role="presentation" on:click={close}>
    <div
      class="w-full max-w-md rounded-t-3xl bg-white p-6 pb-8 sm:rounded-3xl"
      role="dialog"
      aria-modal="true"
      on:click|stopPropagation={() => {}}
    >
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-display text-lg font-semibold text-ink">Fund wallet</h2>
        <button on:click={close} class="text-ink/40" aria-label="Close">✕</button>
      </div>

      <div class="mb-3 grid grid-cols-4 gap-2">
        {#each presets as preset}
          <button
            type="button"
            on:click={() => (amount = preset)}
            class="rounded-lg border py-2 text-xs font-semibold transition"
            class:border-fanu-500={amount === preset}
            class:bg-fanu-50={amount === preset}
            class:border-fanu-100={amount !== preset}
          >
            ₦{preset.toLocaleString()}
          </button>
        {/each}
      </div>

      <label class="flex flex-col gap-1.5">
        <span class="text-xs font-medium text-ink/60">Or enter an amount</span>
        <input
          type="number"
          min="100"
          bind:value={amount}
          placeholder="₦ Amount"
          class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500"
        />
      </label>

      <button
        type="button"
        on:click={submit}
        disabled={!amount || amount < 100 || loading}
        class="mt-4 w-full rounded-xl bg-fanu-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-fanu-700 disabled:opacity-50"
      >
        {loading ? 'Processing…' : amount ? `Fund with ${formatNaira(amount)}` : 'Enter an amount'}
      </button>
      <p class="mt-3 text-center text-[11px] text-ink/40">
        Demo mode — this credits your wallet instantly, no real payment.
      </p>
    </div>
  </div>
{/if}
