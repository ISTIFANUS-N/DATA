<script lang="ts">
  import { goto } from '$app/navigation';
  import { DISCOS } from '$lib/data/catalog';
  import { purchaseService, walletBalance, beneficiaries, isBeneficiarySaved } from '$lib/stores/db';
  import { mockValidateAccount, type ValidationResult } from '$lib/validation';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira, formatDate } from '$lib/format';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import PurchaseConfirm from '$lib/components/PurchaseConfirm.svelte';
  import SaveBeneficiaryPrompt from '$lib/components/SaveBeneficiaryPrompt.svelte';
  import BeneficiaryChips from '$lib/components/BeneficiaryChips.svelte';
  import ValidationStatus from '$lib/components/ValidationStatus.svelte';
  import TransactionReceipt from '$lib/components/TransactionReceipt.svelte';
  import type { Beneficiary, Transaction } from '$lib/types';

  let disco = '';
  let meterType: 'prepaid' | 'postpaid' = 'prepaid';
  const meterTypes = ['prepaid', 'postpaid'] as const;
  let meterNumber = '';
  let amount: number | null = null;
  let error = '';

  let validationState: 'idle' | 'validating' | 'valid' | 'invalid' = 'idle';
  let validationError = '';
  let customerName = '';
  let validationToken = 0;

  let step: 'form' | 'confirm' | 'success' | 'failed' = 'form';
  let submitting = false;
  let completedTx: Transaction | null = null;

  $: meterBeneficiaries = $beneficiaries.filter((b) => b.kind === 'meter');

  $: void runValidation(meterNumber, disco);

  function runValidation(value: string, currentDisco: string) {
    if (!currentDisco || value.trim().length < 6) {
      validationState = 'idle';
      return;
    }
    const token = ++validationToken;
    validationState = 'validating';

    setTimeout(async () => {
      const result: ValidationResult = await mockValidateAccount(value, 10);
      if (token !== validationToken) return;
      if (result.valid) {
        validationState = 'valid';
        customerName = result.customerName ?? '';
      } else {
        validationState = 'invalid';
        validationError = result.error ?? '';
      }
    }, 450);
  }

  function pickBeneficiary(b: Beneficiary) {
    meterNumber = b.value;
    if (b.extra) disco = b.extra;
  }

  function review() {
    error = '';
    if (!disco) return (error = 'Choose an electricity provider.');
    if (meterNumber.trim().length < 6) return (error = 'Enter a valid meter number.');
    if (validationState !== 'valid') return (error = 'This meter number could not be verified.');
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
        meta: { disco, meterType, meterNumber, customerName }
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
        showToast(`Token sent for meter ${meterNumber}`);
        step = 'success';
      }
    }, 700);
  }

  function resetForm() {
    meterNumber = '';
    amount = null;
    validationState = 'idle';
    completedTx = null;
    step = 'form';
  }
</script>

<svelte:head><title>Pay electricity bill — Stefanx</title></svelte:head>

{#if step !== 'success' && step !== 'failed'}
  <PageHeader title="Electricity bill" />
{/if}

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
      {#each meterTypes as type}
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
    <label class="mb-2 flex flex-col gap-1.5">
      <input
        type="text"
        bind:value={meterNumber}
        placeholder="e.g. 04012345678"
        class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500"
      />
    </label>
    <ValidationStatus state={validationState} {customerName} error={validationError} />

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
      disabled={validationState === 'validating'}
      class="w-full rounded-xl bg-spark-500 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-spark-600 disabled:opacity-60"
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
      { label: 'Meter number', value: meterNumber },
      { label: 'Customer name', value: customerName }
    ]}
    {submitting}
    {error}
    onConfirm={confirmPurchase}
    onBack={() => (step = 'form')}
  />
{:else if step === 'success' && completedTx}
  <TransactionReceipt
    status="success"
    title="Purchase Successful!"
    subtitle="Your electricity token has been generated"
    reference={completedTx.reference}
    rows={[
      { label: 'Service / Product', value: `${disco} · ${meterType}` },
      { label: 'Meter number', value: meterNumber },
      { label: 'Customer name', value: customerName },
      { label: 'Amount Charged', value: `-${formatNaira(completedTx.amount)}`, emphasis: true },
      { label: 'Transaction Date', value: formatDate(completedTx.createdAt) }
    ]}
    shareText={`FANU receipt\n${disco} Electricity\nMeter: ${meterNumber}\nAmount: ${formatNaira(completedTx.amount)}\nRef: ${completedTx.reference}`}
    onDone={() => goto('/dashboard')}
    onBuyAgain={resetForm}
  />
  {#if !isBeneficiarySaved('meter', meterNumber)}
    <div class="mx-auto mb-6 max-w-sm px-4">
      <SaveBeneficiaryPrompt
        kind="meter"
        value={meterNumber}
        extra={disco}
        valueLabel={`meter ${meterNumber}`}
        onDone={() => {}}
      />
    </div>
  {/if}
{:else if step === 'failed' && completedTx}
  <TransactionReceipt
    status="failed"
    title="Transaction Failed"
    subtitle="Unable to complete your electricity purchase. Please try again."
    reference={completedTx.reference}
    rows={[
      { label: 'Service / Product', value: `${disco} · ${meterType}` },
      { label: 'Meter number', value: meterNumber },
      { label: 'Amount', value: formatNaira(completedTx.amount) }
    ]}
    shareText={`FANU receipt\n${disco} Electricity — Failed\nMeter: ${meterNumber}\nRef: ${completedTx.reference}`}
    onDone={() => goto('/dashboard')}
    onRetry={confirmPurchase}
    retrying={submitting}
  />
{/if}
