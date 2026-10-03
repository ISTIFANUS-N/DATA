<script lang="ts">
  import { serviceToggles } from '$lib/stores/serviceStatus';
  import ServiceUnavailable from '$lib/components/ServiceUnavailable.svelte';
  import { goto } from '$app/navigation';
  import { type CablePlan } from '$lib/data/catalog';
  import { cablePlans } from '$lib/stores/catalog';
  import { purchaseService, walletBalance, beneficiaries, isBeneficiarySaved, currentProfile } from '$lib/stores/db';
  import { mockValidateAccount, type ValidationResult } from '$lib/validation';
  import { applyPackagePricing, packageLabel } from '$lib/pricing';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira, formatDate } from '$lib/format';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import BrandLogo from '$lib/components/BrandLogo.svelte';
  import PurchaseConfirm from '$lib/components/PurchaseConfirm.svelte';
  import SaveBeneficiaryPrompt from '$lib/components/SaveBeneficiaryPrompt.svelte';
  import BeneficiaryChips from '$lib/components/BeneficiaryChips.svelte';
  import ValidationStatus from '$lib/components/ValidationStatus.svelte';
  import TransactionReceipt from '$lib/components/TransactionReceipt.svelte';
  import type { Beneficiary, Transaction } from '$lib/types';

  const providers = ['DSTV', 'GOTV', 'STARTIMES'] as const;

  let provider: (typeof providers)[number] = 'DSTV';
  let smartcardNumber = '';
  let selectedPlan: CablePlan | null = null;
  let confirmedPlan: CablePlan | null = null;
  let error = '';

  let validationState: 'idle' | 'validating' | 'valid' | 'invalid' = 'idle';
  let validationError = '';
  let customerName = '';
  let validationToken = 0;

  let step: 'form' | 'confirm' | 'success' | 'failed' = 'form';
  let submitting = false;
  let completedTx: Transaction | null = null;

  $: plansForProvider = $cablePlans.filter((p) => p.provider === provider && p.isActive);
  $: smartcardBeneficiaries = $beneficiaries.filter((b) => b.kind === 'smartcard');
  $: pkg = $currentProfile?.package ?? 'smart_user';
  $: chargedPrice = selectedPlan ? applyPackagePricing(selectedPlan.price, 'cable', pkg) : 0;

  $: {
    if (selectedPlan && selectedPlan.provider !== provider) selectedPlan = null;
  }

  $: void runValidation(smartcardNumber);

  function runValidation(value: string) {
    if (value.trim().length < 8) {
      validationState = 'idle';
      return;
    }
    const token = ++validationToken;
    validationState = 'validating';

    // timeout removed — now truly async
    (async () => {
      const result: ValidationResult = await mockValidateAccount(value, 8);
      if (token !== validationToken) return;
      if (result.valid) {
        validationState = 'valid';
        customerName = result.customerName ?? '';
      } else {
        validationState = 'invalid';
        validationError = result.error ?? '';
      }
    })();
  }

  function pickBeneficiary(b: Beneficiary) {
    smartcardNumber = b.value;
    if (b.extra && providers.includes(b.extra as (typeof providers)[number])) {
      provider = b.extra as (typeof providers)[number];
    }
  }

  function review() {
    error = '';
    if (smartcardNumber.trim().length < 8) return (error = 'Enter a valid smartcard/IUC number.');
    if (validationState !== 'valid') return (error = 'This smartcard/IUC number could not be verified.');
    if (!selectedPlan) return (error = 'Choose a package.');
    step = 'confirm';
  }

  async function confirmPurchase() {
    error = '';
    submitting = true;
    const plan = confirmedPlan ?? selectedPlan!;
    confirmedPlan = plan;
    // timeout removed — now truly async
    (async () => {
      const result = await purchaseService({
        type: 'cable',
        amount: applyPackagePricing(plan.price, 'cable', pkg),
        description: `${plan.packageName} · ${smartcardNumber}`,
        meta: { provider, smartcardNumber, planId: plan.id, customerName }
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
        showToast(`${plan.packageName} renewed for ${smartcardNumber}`);
        step = 'success';
      }
    })();
  }

  function resetForm() {
    smartcardNumber = '';
    selectedPlan = null;
    confirmedPlan = null;
    validationState = 'idle';
    completedTx = null;
    step = 'form';
  }
  $: serviceToggle = $serviceToggles.find(s => s.key === 'cable');
  $: serviceEnabled = serviceToggle?.isEnabled ?? true;
  $: serviceReason = serviceToggle?.disabledReason ?? '';

</script>

<svelte:head><title>Cable TV subscription — Stefanx</title></svelte:head>

{#if step !== 'success' && step !== 'failed'}
  <PageHeader title="Cable TV" />
{/if}


{#if !serviceEnabled}
  <ServiceUnavailable label="Cable TV" reason={serviceReason} />
{:else}
{#if step === 'form'}
  <div class="px-4 py-5">
    <p class="mb-2 text-xs font-medium text-ink/60">Provider</p>
    <div class="mb-5 grid grid-cols-3 gap-2">
      {#each providers as p}
        <button
          type="button"
          on:click={() => (provider = p)}
          class="flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition"
          class:border-fanu-500={provider === p}
          class:bg-fanu-50={provider === p}
          class:border-fanu-100={provider !== p}
        >
          <BrandLogo code={p} size="md" />
          {p === 'DSTV' ? 'DStv' : p === 'GOTV' ? 'GOtv' : 'StarTimes'}
        </button>
      {/each}
    </div>

    <p class="mb-2 text-xs font-medium text-ink/60">Smartcard / IUC number</p>
    <BeneficiaryChips items={smartcardBeneficiaries} onSelect={pickBeneficiary} />
    <label class="mb-2 flex flex-col gap-1.5">
      <input
        type="text"
        bind:value={smartcardNumber}
        placeholder="e.g. 1234567890"
        class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500"
      />
    </label>
    <ValidationStatus state={validationState} {customerName} error={validationError} />

    <p class="mb-2 text-xs font-medium text-ink/60">Choose a package</p>
    <div class="mb-5 flex flex-col gap-2">
      {#each plansForProvider as plan (plan.id)}
        <button
          type="button"
          on:click={() => (selectedPlan = plan)}
          class="flex items-center justify-between rounded-xl border px-4 py-3 text-left transition"
          class:border-fanu-500={selectedPlan?.id === plan.id}
          class:bg-fanu-50={selectedPlan?.id === plan.id}
          class:border-fanu-100={selectedPlan?.id !== plan.id}
        >
          <p class="text-sm font-semibold text-ink">{plan.packageName}</p>
          <p class="font-mono text-sm font-semibold tabular-nums text-fanu-700">
            {formatNaira(applyPackagePricing(plan.price, 'cable', pkg))}
          </p>
        </button>
      {/each}
    </div>

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
{:else if step === 'confirm' && selectedPlan}
  <PurchaseConfirm
    title="You're paying"
    amount={chargedPrice}
    amountLabel={pkg === 'reseller' ? `Reseller price · ${packageLabel(pkg)}` : 'Package price'}
    rows={[
      { label: 'Provider', value: provider },
      { label: 'Package', value: selectedPlan.packageName },
      { label: 'Smartcard / IUC', value: smartcardNumber },
      { label: 'Customer name', value: customerName }
    ]}
    {submitting}
    {error}
    onConfirm={confirmPurchase}
    onBack={() => (step = 'form')}
  />
{:else if step === 'success' && completedTx && confirmedPlan}
  <TransactionReceipt
    status="success"
    title="Purchase Successful!"
    subtitle="Your subscription has been renewed"
    reference={completedTx.reference}
    rows={[
      { label: 'Service / Product', value: confirmedPlan.packageName },
      { label: 'Smartcard / IUC', value: smartcardNumber },
      { label: 'Customer name', value: customerName },
      { label: 'Amount Charged', value: `-${formatNaira(completedTx.amount)}`, emphasis: true },
      { label: 'Transaction Date', value: formatDate(completedTx.createdAt) }
    ]}
    shareText={`FANU receipt\n${confirmedPlan.packageName}\nSmartcard: ${smartcardNumber}\nAmount: ${formatNaira(completedTx.amount)}\nRef: ${completedTx.reference}`}
    onDone={() => goto('/dashboard')}
    onBuyAgain={resetForm}
  />
  {#if !isBeneficiarySaved('smartcard', smartcardNumber)}
    <div class="mx-auto mb-6 max-w-sm px-4">
      <SaveBeneficiaryPrompt
        kind="smartcard"
        value={smartcardNumber}
        extra={provider}
        valueLabel={`smartcard ${smartcardNumber}`}
        onDone={() => {}}
      />
    </div>
  {/if}
{:else if step === 'failed' && completedTx && confirmedPlan}
  <TransactionReceipt
    status="failed"
    title="Transaction Failed"
    subtitle="Unable to complete your cable TV subscription. Please try again."
    reference={completedTx.reference}
    rows={[
      { label: 'Service / Product', value: confirmedPlan.packageName },
      { label: 'Smartcard / IUC', value: smartcardNumber },
      { label: 'Amount', value: formatNaira(completedTx.amount) }
    ]}
    shareText={`FANU receipt\n${confirmedPlan.packageName} — Failed\nSmartcard: ${smartcardNumber}\nRef: ${completedTx.reference}`}
    onDone={() => goto('/dashboard')}
    onRetry={confirmPurchase}
    retrying={submitting}
  />
{/if}
{/if}
