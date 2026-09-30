<script lang="ts">
  import { serviceToggles } from '$lib/stores/serviceStatus';
  import ServiceUnavailable from '$lib/components/ServiceUnavailable.svelte';
  import { goto } from '$app/navigation';
  import { RESULT_CHECKER_PINS, type ResultCheckerPin } from '$lib/data/catalog';
  import { purchaseService, walletBalance } from '$lib/stores/db';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira, formatDate } from '$lib/format';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import PurchaseConfirm from '$lib/components/PurchaseConfirm.svelte';
  import TransactionReceipt from '$lib/components/TransactionReceipt.svelte';
  import type { Transaction } from '$lib/types';

  let selectedPin: ResultCheckerPin | null = null;
  let quantity = 1;
  let error = '';

  let step: 'form' | 'confirm' | 'success' | 'failed' = 'form';
  let submitting = false;
  let completedTx: Transaction | null = null;
  let generatedPins: string[] = [];

  $: totalCost = selectedPin ? selectedPin.price * quantity : 0;

  function generateMockPins(count: number): string[] {
    return Array.from({ length: count }, () => {
      const values = new Uint32Array(4);
      crypto.getRandomValues(values);
      return Array.from(values, v => String(v % 10000).padStart(4, '0')).join('-');
    });
  }

  function review() {
    error = '';
    if (!selectedPin) return (error = 'Choose a result checker type.');
    if (!quantity || quantity < 1) return (error = 'Enter a quantity of at least 1.');
    if (quantity > 10) return (error = 'Maximum 10 PINs per order.');
    step = 'confirm';
  }

  async function confirmPurchase() {
    error = '';
    submitting = true;
    // timeout removed — now truly async
    (async () => {
      const result = await purchaseService({
        type: 'result_checker',
        amount: totalCost,
        description: `${quantity}× ${selectedPin!.label}`,
        meta: { type: selectedPin!.type, quantity: String(quantity) }
      });
      submitting = false;

      if (!result.ok) { error = result.error; step = 'form'; return; }
      completedTx = result.transaction;
      if (result.transaction.status === 'failed') { step = 'failed'; return; }
      generatedPins = generateMockPins(quantity);
      showToast(`${quantity} ${selectedPin!.type} PIN${quantity > 1 ? 's' : ''} generated`);
      step = 'success';
    })();
  }

  async function copyAllPins() {
    try {
      await navigator.clipboard.writeText(generatedPins.join('\n'));
      showToast('PINs copied');
    } catch { /* non-critical */ }
  }
  $: serviceToggle = $serviceToggles.find(s => s.key === 'result_checker');
  $: serviceEnabled = serviceToggle?.isEnabled ?? true;
  $: serviceReason = serviceToggle?.disabledReason ?? '';

</script>

<svelte:head><title>Result Checker — Stefanx Data Services</title></svelte:head>

{#if step !== 'success' && step !== 'failed'}
  <PageHeader title="Result checker" />
{/if}


{#if !serviceEnabled}
  <ServiceUnavailable label="Result checker" reason={serviceReason} />
{:else}
{#if step === 'form'}
  <div class="px-4 py-5">
    <p class="mb-2 text-xs font-medium text-ink/60">Exam type</p>
    <div class="mb-5 grid grid-cols-2 gap-2">
      {#each RESULT_CHECKER_PINS as pin (pin.id)}
        <button
          type="button"
          on:click={() => (selectedPin = pin)}
          class="rounded-xl border p-3 text-left transition"
          class:border-fanu-500={selectedPin?.id === pin.id}
          class:bg-fanu-50={selectedPin?.id === pin.id}
          class:border-fanu-100={selectedPin?.id !== pin.id}
        >
          <p class="text-sm font-semibold text-ink">{pin.type}</p>
          <p class="text-[11px] text-ink/55">{pin.label}</p>
          <p class="mt-1 font-mono text-sm font-semibold tabular-nums text-fanu-700">{formatNaira(pin.price)}</p>
        </button>
      {/each}
    </div>

    <label class="mb-5 flex flex-col gap-1.5">
      <span class="text-xs font-medium text-ink/60">Quantity (max 10)</span>
      <input type="number" min="1" max="10" bind:value={quantity} class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500" />
    </label>

    {#if selectedPin && quantity}
      <p class="mb-5 text-sm text-ink/60">Total: <span class="font-semibold text-ink">{formatNaira(totalCost)}</span> · Wallet: {formatNaira($walletBalance)}</p>
    {/if}

    {#if error}<p class="mb-3 text-sm text-red-600">{error}</p>{/if}

    <button type="button" on:click={review} class="w-full rounded-xl bg-spark-500 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-spark-600">
      Review
    </button>
  </div>
{:else if step === 'confirm' && selectedPin}
  <PurchaseConfirm
    title="You're buying"
    amount={totalCost}
    amountLabel="Total cost"
    confirmLabel="Generate PINs"
    rows={[
      { label: 'Exam type', value: selectedPin.type },
      { label: 'Quantity', value: `${quantity} PIN${quantity > 1 ? 's' : ''}` },
      { label: 'Cost per PIN', value: formatNaira(selectedPin.price) }
    ]}
    {submitting} {error}
    onConfirm={confirmPurchase}
    onBack={() => (step = 'form')}
  />
{:else if step === 'success' && completedTx && selectedPin}
  <div class="px-4 py-5">
    <TransactionReceipt
      status="success"
      title="PINs Generated!"
      subtitle="Save your PINs carefully — they won't be shown again"
      reference={completedTx.reference}
      rows={[
        { label: 'Exam type', value: selectedPin.type },
        { label: 'Quantity', value: `${quantity} PIN${quantity > 1 ? 's' : ''}` },
        { label: 'Amount Charged', value: `-${formatNaira(completedTx.amount)}`, emphasis: true },
        { label: 'Transaction Date', value: formatDate(completedTx.createdAt) }
      ]}
      shareText={`Stefanx ${selectedPin.type} PINs\n${generatedPins.join('\n')}\nRef: ${completedTx.reference}`}
      onDone={() => goto('/dashboard')}
    />

    <div class="mt-2 overflow-hidden rounded-2xl bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-fanu-50 px-4 py-3">
        <p class="text-sm font-semibold text-ink">Your {selectedPin.type} PINs</p>
        <button type="button" on:click={copyAllPins} class="text-xs font-medium text-fanu-700 hover:underline">Copy all</button>
      </div>
      {#each generatedPins as pin, i}
        <div class="flex items-center gap-3 border-b border-fanu-50 px-4 py-3 last:border-0">
          <span class="text-[11px] text-ink/40">{i + 1}.</span>
          <span class="flex-1 font-mono text-sm font-semibold tracking-widest text-ink">{pin}</span>
        </div>
      {/each}
    </div>
  </div>
{:else if step === 'failed' && completedTx}
  <TransactionReceipt
    status="failed"
    title="Purchase Failed"
    subtitle="Unable to generate your result checker PIN. Please try again."
    reference={completedTx.reference}
    rows={[{ label: 'Exam type', value: selectedPin?.type ?? '' }, { label: 'Amount', value: formatNaira(completedTx.amount) }]}
    shareText={`Stefanx Result Checker — Failed\nRef: ${completedTx.reference}`}
    onDone={() => goto('/dashboard')}
    onRetry={confirmPurchase}
    retrying={submitting}
  />
{/if}
{/if}
