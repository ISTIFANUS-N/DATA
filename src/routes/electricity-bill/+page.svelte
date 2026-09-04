<script lang="ts">
  import { goto } from '$app/navigation';
  import { DISCOS } from '$lib/data/catalog';
  import { purchaseService, walletBalance, beneficiaries, isBeneficiarySaved } from '$lib/stores/db';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira } from '$lib/format';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import PurchaseConfirm from '$lib/components/PurchaseConfirm.svelte';
  import SaveBeneficiaryPrompt from '$lib/components/SaveBeneficiaryPrompt.svelte';
  import BeneficiaryChips from '$lib/components/BeneficiaryChips.svelte';
  import type { Beneficiary, Transaction } from '$lib/types';

  let disco = '';
  let meterType: 'prepaid' | 'postpaid' = 'prepaid';
  let meterNumber = '';
  let amount: number | null = null;
  let error = '';

  let step: 'form' | 'confirm' | 'success' = 'form';
  let submitting = false;
  let completedTx: Transaction | null = null;

  $: meterBeneficiaries = $beneficiaries.filter((b) => b.kind === 'meter');

  function pickBeneficiary(b: Beneficiary) {
    meterNumber = b.value;
    if (b.extra) disco = b.extra;
  }

  function review() {
    error = '';
    if (!disco) return (error = 'Choose an electricity provider.');
    if (meterNumber.trim().length < 6) return (error = 'Enter a valid meter number.');
    if (!amount || amount < 500) return (error = 'Minimum purchase is ₦500.');
    step = 'confirm';
  }

  function confirmPurchase() {
    error = '';
    submitting = true;
    setTimeout(() => {
      const result = purchaseService({
        type: 'electricity',
        amount: amount!,
        description: `${disco} · ${meterType} · ${meterNumber}`,
        meta: { disco, meterType, meterNumber }
      });
      submitting = false;

      if (!result.ok) {
        error = result.error;
        step = 'form';
        return;
      }
      completedTx = result.transaction;
      showToast(`Token sent for meter ${meterNumber}`);
      step = 'success';
    }, 500);
  }
</script>

<svelte:head><title>Pay electricity bill — Stefanx</title></svelte:head>

<PageHeader title="Electricity bill" />

{#if step === 'form'}
  <div class="px-4 py-5">
    <label class="mb-5 flex flex-col gap-1.5">
      <span class="text-xs font-medium text-ink/60">Distribution company</span>
      <select
        bind:value={disco}
        class="rounded-xl border border-fanu-100 bg-white px-3.5 py-3 text-sm focus:border-fanu-500"
      >
        <option value="" disabled selected>Select provider</option>
        {#each DISCOS as d}
          <option value={d.code}>{d.label}</option>
        {/each}
      </select>
    </label>

    <p class="mb-2 text-xs font-medium text-ink/60">Meter type</p>
    <div class="mb-5 grid grid-cols-2 gap-2">
      {#each ['prepaid', 'postpaid'] as type}
        <button
          type="button"
          on:click={() => (meterType = type)}
          class="rounded-xl border py-2.5 text-sm font-semibold capitalize transition"
          class:border-fanu-500={meterType === type}
          class:bg-fanu-50={meterType === type}
          class:border-fanu-100={meterType !== type}
        >
          {type}
        </button>
      {/each}
    </div>

    <p class="mb-2 text-xs font-medium text-ink/60">Meter number</p>
    <BeneficiaryChips items={meterBeneficiaries} onSelect={pickBeneficiary} />
    <label class="mb-5 flex flex-col gap-1.5">
      <input
        type="text"
        bind:value={meterNumber}
        placeholder="e.g. 04012345678"
        class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500"
      />
    </label>

    <label class="mb-1 flex flex-col gap-1.5">
      <span class="text-xs font-medium text-ink/60">Amount</span>
      <input
        type="number"
        min="500"
        bind:value={amount}
        placeholder="₦ Amount"
        class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500"
      />
    </label>
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
    title="You're paying"
    amount={amount ?? 0}
    amountLabel="Electricity amount"
    rows={[
      { label: 'Provider', value: disco },
      { label: 'Meter type', value: meterType },
      { label: 'Meter number', value: meterNumber }
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
      <p class="font-display text-lg font-semibold text-ink">Token sent</p>
      <p class="mt-1 text-sm text-ink/50">{formatNaira(completedTx.amount)} to meter {meterNumber}</p>
    </div>

    {#if !isBeneficiarySaved('meter', meterNumber)}
      <div class="mb-5">
        <SaveBeneficiaryPrompt
          kind="meter"
          value={meterNumber}
          extra={disco}
          valueLabel={`meter ${meterNumber}`}
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
