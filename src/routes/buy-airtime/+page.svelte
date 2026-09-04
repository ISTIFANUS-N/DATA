<script lang="ts">
  import { goto } from '$app/navigation';
  import { NETWORKS, type Network } from '$lib/data/catalog';
  import { purchaseService, walletBalance, beneficiaries, isBeneficiarySaved } from '$lib/stores/db';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira } from '$lib/format';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import PurchaseConfirm from '$lib/components/PurchaseConfirm.svelte';
  import SaveBeneficiaryPrompt from '$lib/components/SaveBeneficiaryPrompt.svelte';
  import BeneficiaryChips from '$lib/components/BeneficiaryChips.svelte';
  import type { Beneficiary, Transaction } from '$lib/types';

  const presets = [100, 200, 500, 1000, 2000, 5000];

  let network: Network | null = null;
  let phoneNumber = '';
  let amount: number | null = null;
  let error = '';

  let step: 'form' | 'confirm' | 'success' = 'form';
  let submitting = false;
  let completedTx: Transaction | null = null;

  $: phoneBeneficiaries = $beneficiaries.filter((b) => b.kind === 'phone');

  function pickBeneficiary(b: Beneficiary) {
    phoneNumber = b.value;
    if (b.extra && NETWORKS.some((n) => n.code === b.extra)) {
      network = b.extra as Network;
    }
  }

  function review() {
    error = '';
    if (!network) return (error = 'Choose a network.');
    if (!/^0\d{10}$/.test(phoneNumber)) return (error = 'Enter a valid 11-digit phone number.');
    if (!amount || amount < 50) return (error = 'Minimum airtime purchase is ₦50.');
    step = 'confirm';
  }

  function confirmPurchase() {
    error = '';
    submitting = true;
    setTimeout(() => {
      const result = purchaseService({
        type: 'airtime',
        amount: amount!,
        description: `${network} airtime · ${phoneNumber}`,
        meta: { network: network!, phoneNumber }
      });
      submitting = false;

      if (!result.ok) {
        error = result.error;
        step = 'form';
        return;
      }
      completedTx = result.transaction;
      showToast(`${formatNaira(amount!)} airtime sent to ${phoneNumber}`);
      step = 'success';
    }, 500);
  }
</script>

<svelte:head><title>Buy airtime — Stefanx</title></svelte:head>

<PageHeader title="Buy airtime" />

{#if step === 'form'}
  <div class="px-4 py-5">
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

    <p class="mb-2 text-xs font-medium text-ink/60">Phone number</p>
    <BeneficiaryChips items={phoneBeneficiaries} onSelect={pickBeneficiary} />
    <label class="mb-5 flex flex-col gap-1.5">
      <input
        type="tel"
        bind:value={phoneNumber}
        placeholder="08012345678"
        pattern="0\d{10}"
        class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500"
      />
    </label>

    <p class="mb-2 text-xs font-medium text-ink/60">Amount</p>
    <div class="mb-3 grid grid-cols-3 gap-2">
      {#each presets as preset}
        <button
          type="button"
          on:click={() => (amount = preset)}
          class="rounded-lg border py-2.5 text-sm font-semibold transition"
          class:border-fanu-500={amount === preset}
          class:bg-fanu-50={amount === preset}
          class:border-fanu-100={amount !== preset}
        >
          ₦{preset.toLocaleString()}
        </button>
      {/each}
    </div>
    <input
      type="number"
      min="50"
      bind:value={amount}
      placeholder="Or enter an amount"
      class="mb-1 w-full rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500"
    />
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
    title="You're buying"
    amount={amount ?? 0}
    amountLabel="Airtime amount"
    rows={[
      { label: 'Network', value: network ?? '' },
      { label: 'Phone number', value: phoneNumber }
    ]}
    {submitting}
    {error}
    onConfirm={confirmPurchase}
    onBack={() => (step = 'form')}
  />
{:else if step === 'success' && completedTx}
  <div class="px-4 py-5">
    <div class="mb-5 rounded-2xl bg-white p-6 text-center shadow-sm">
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-fanu-50 text-2xl">✓</div>
      <p class="font-display text-lg font-semibold text-ink">Airtime sent</p>
      <p class="mt-1 text-sm text-ink/50">{formatNaira(completedTx.amount)} to {phoneNumber}</p>
    </div>

    {#if !isBeneficiarySaved('phone', phoneNumber)}
      <div class="mb-5">
        <SaveBeneficiaryPrompt
          kind="phone"
          value={phoneNumber}
          extra={network ?? undefined}
          valueLabel={phoneNumber}
          onDone={() => goto('/dashboard')}
        />
      </div>
    {/if}

    <button
      type="button"
      on:click={() => goto('/dashboard')}
      class="w-full rounded-xl border border-fanu-100 py-3 text-sm font-semibold text-ink/70 transition hover:bg-fanu-50"
    >
      Back to dashboard
    </button>
  </div>
{/if}
