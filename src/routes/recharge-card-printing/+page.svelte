<script lang="ts">
  import { serviceToggles } from '$lib/stores/serviceStatus';
  import ServiceUnavailable from '$lib/components/ServiceUnavailable.svelte';
  import { goto } from '$app/navigation';
  import { NETWORKS, type Network } from '$lib/data/catalog';
  import { purchaseService, walletBalance, currentProfile } from '$lib/stores/db';
  import { applyPackagePricing, packageLabel } from '$lib/pricing';
  import { generateRechargeCards, cardsToText, type RechargeCard } from '$lib/rechargeCard';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira, formatDate } from '$lib/format';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import PurchaseConfirm from '$lib/components/PurchaseConfirm.svelte';
  import TransactionReceipt from '$lib/components/TransactionReceipt.svelte';
  import type { Transaction } from '$lib/types';

  const denominations = [100, 200, 500, 1000, 1500];

  let network: Network | null = null;
  let denomination: number | null = null;
  let quantity: number | null = null;
  let error = '';

  let step: 'form' | 'confirm' | 'success' | 'failed' = 'form';
  let submitting = false;
  let completedTx: Transaction | null = null;
  let cards: RechargeCard[] = [];

  $: pkg = $currentProfile?.package ?? 'smart_user';
  $: faceValueTotal = denomination && quantity ? denomination * quantity : 0;
  $: chargedTotal = faceValueTotal ? applyPackagePricing(faceValueTotal, 'airtime', pkg) : 0;

  function review() {
    error = '';
    if (!network) return (error = 'Choose a network.');
    if (!denomination) return (error = 'Choose a card denomination.');
    if (!quantity || quantity < 1) return (error = 'Enter how many cards to print.');
    if (quantity > 100) return (error = 'Maximum 100 cards per batch.');
    step = 'confirm';
  }

  async function confirmPurchase() {
    error = '';
    submitting = true;
    // timeout removed — now truly async
    (async () => {
      const result = await purchaseService({
        type: 'recharge_card_printing',
        amount: chargedTotal,
        description: `${quantity} × ${network} ${formatNaira(denomination!)} recharge cards`,
        meta: { network: network!, denomination: String(denomination), quantity: String(quantity) }
      });
      submitting = false;

      if (!result.ok) {
        error = result.error;
        step = 'form';
        return;
      }
      completedTx = result.transaction;
      if (result.transaction.status === 'failed') {
        step = 'failed';
      } else {
        cards = generateRechargeCards(network!, denomination!, quantity!);
        showToast(`${quantity} ${network} cards printed`);
        step = 'success';
      }
    })();
  }

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    const text = cardsToText(network!, cards);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${network}-recharge-cards-${completedTx?.reference ?? 'batch'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
  $: serviceToggle = $serviceToggles.find(s => s.key === 'recharge_cards');
  $: serviceEnabled = serviceToggle?.isEnabled ?? true;
  $: serviceReason = serviceToggle?.disabledReason ?? '';

</script>

<svelte:head><title>Recharge card printing — Stefanx</title></svelte:head>

{#if step !== 'success' && step !== 'failed'}
  <PageHeader title="Recharge card printing" />
{/if}


{#if !serviceEnabled}
  <ServiceUnavailable label="Recharge card printing" reason={serviceReason} />
{:else}
{#if step === 'form'}
  <div class="px-4 py-5">
    <div class="mb-5 rounded-xl bg-fanu-50 px-4 py-3 text-xs text-fanu-800">
      Print a batch of recharge card PINs for offline resale. Each card is a real deduction
      from your wallet at the time of printing — cards can't be "unprinted".
    </div>

    <p class="mb-2 text-xs font-medium text-ink/60">Network</p>
    <div class="mb-5 grid grid-cols-4 gap-2">
      {#each NETWORKS as n}
        <button
          type="button"
          on:click={() => (network = n.code)}
          class="flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition"
          class:border-fanu-500={network === n.code}
          class:bg-fanu-50={network === n.code}
          class:border-fanu-100={network !== n.code}
        >
          <span class="h-6 w-6 rounded-full" style="background:{n.color}"></span>
          {n.label}
        </button>
      {/each}
    </div>

    <p class="mb-2 text-xs font-medium text-ink/60">Card denomination</p>
    <div class="mb-5 grid grid-cols-5 gap-2">
      {#each denominations as d}
        <button
          type="button"
          on:click={() => (denomination = d)}
          class="rounded-lg border py-2.5 text-xs font-semibold transition"
          class:border-fanu-500={denomination === d}
          class:bg-fanu-50={denomination === d}
          class:border-fanu-100={denomination !== d}
        >
          ₦{d}
        </button>
      {/each}
    </div>

    <label class="mb-1 flex flex-col gap-1.5">
      <span class="text-xs font-medium text-ink/60">Quantity (max 100)</span>
      <input
        type="number"
        min="1"
        max="100"
        bind:value={quantity}
        placeholder="e.g. 20"
        class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500"
      />
    </label>

    {#if faceValueTotal}
      <p class="mb-1 mt-1.5 text-xs text-ink/50">
        Total: <span class="font-semibold text-fanu-700">{formatNaira(chargedTotal)}</span>
        {#if pkg === 'reseller'}
          <span class="text-fanu-600">({packageLabel(pkg)} price)</span>
        {/if}
      </p>
    {/if}
    <p class="mb-5 text-[11px] text-ink/40">Wallet balance: {formatNaira($walletBalance)}</p>

    {#if error}
      <p class="mb-3 text-sm text-red-600">{error}</p>
    {/if}

    <button
      type="button"
      on:click={review}
      class="w-full rounded-xl bg-spark-500 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-spark-600"
    >
      Review
    </button>
  </div>
{:else if step === 'confirm'}
  <PurchaseConfirm
    title="You're printing"
    amount={chargedTotal}
    amountLabel={pkg === 'reseller' ? `Reseller price · ${packageLabel(pkg)}` : 'Total cost'}
    confirmLabel="Print cards"
    rows={[
      { label: 'Network', value: network ?? '' },
      { label: 'Denomination', value: formatNaira(denomination ?? 0) },
      { label: 'Quantity', value: String(quantity ?? 0) }
    ]}
    {submitting}
    {error}
    onConfirm={confirmPurchase}
    onBack={() => (step = 'form')}
  />
{:else if step === 'success' && completedTx}
  <div class="px-4 py-5">
    <div class="mb-5 rounded-2xl bg-white p-6 text-center shadow-sm print:hidden">
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-fanu-50 text-2xl">✓</div>
      <p class="font-display text-lg font-semibold text-ink">{cards.length} cards printed</p>
      <p class="mt-1 text-sm text-ink/50">{formatNaira(completedTx.amount)} · {network} · {formatNaira(denomination ?? 0)} each</p>
    </div>

    <div class="mb-5 flex gap-2.5 print:hidden">
      <button
        type="button"
        on:click={handlePrint}
        class="flex-1 rounded-xl bg-fanu-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-fanu-700"
      >
        Print
      </button>
      <button
        type="button"
        on:click={handleDownload}
        class="flex-1 rounded-xl border border-fanu-100 py-3 text-sm font-semibold text-ink/70 transition hover:bg-fanu-50"
      >
        Download
      </button>
    </div>

    <div class="mb-5 overflow-hidden rounded-2xl bg-white shadow-sm print:shadow-none">
      <div class="border-b border-fanu-50 px-4 py-3">
        <p class="font-display text-sm font-semibold text-ink">{network} · {formatNaira(denomination ?? 0)} cards</p>
        <p class="text-[11px] text-ink/40">Batch {completedTx.reference} · {cards.length} cards</p>
      </div>
      <div class="max-h-96 overflow-y-auto print:max-h-none print:overflow-visible">
        {#each cards as card, i}
          <div class="flex items-center justify-between border-b border-fanu-50 px-4 py-2.5 text-xs last:border-0">
            <span class="text-ink/40">{i + 1}.</span>
            <span class="font-mono text-ink/70">{card.serial}</span>
            <span class="font-mono font-semibold text-fanu-700">{card.pin}</span>
          </div>
        {/each}
      </div>
    </div>

    <button
      type="button"
      on:click={() => goto('/dashboard')}
      class="w-full rounded-xl border border-fanu-100 py-3 text-sm font-semibold text-ink/70 transition hover:bg-fanu-50 print:hidden"
    >
      Back to dashboard
    </button>
  </div>
{:else if step === 'failed' && completedTx}
  <TransactionReceipt
    status="failed"
    title="Transaction Failed"
    subtitle="Unable to print your recharge cards. Please try again."
    reference={completedTx.reference}
    rows={[
      { label: 'Service / Product', value: `${network} Recharge Cards` },
      { label: 'Quantity', value: String(quantity ?? 0) },
      { label: 'Denomination', value: formatNaira(denomination ?? 0) },
      { label: 'Amount', value: formatNaira(completedTx.amount) }
    ]}
    shareText={`FANU receipt\n${network} Recharge Cards — Failed\nQuantity: ${quantity}\nRef: ${completedTx.reference}`}
    onDone={() => goto('/dashboard')}
    onRetry={confirmPurchase}
    retrying={submitting}
  />
{/if}
{/if}
