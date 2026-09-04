<script lang="ts">
  import { goto } from '$app/navigation';
  import { CABLE_PLANS, type CablePlan } from '$lib/data/catalog';
  import { purchaseService, walletBalance, beneficiaries, isBeneficiarySaved } from '$lib/stores/db';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira } from '$lib/format';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import PurchaseConfirm from '$lib/components/PurchaseConfirm.svelte';
  import SaveBeneficiaryPrompt from '$lib/components/SaveBeneficiaryPrompt.svelte';
  import BeneficiaryChips from '$lib/components/BeneficiaryChips.svelte';
  import type { Beneficiary, Transaction } from '$lib/types';

  const providers = ['DSTV', 'GOTV', 'STARTIMES'] as const;

  let provider: (typeof providers)[number] = 'DSTV';
  let smartcardNumber = '';
  let selectedPlan: CablePlan | null = null;
  let error = '';

  let step: 'form' | 'confirm' | 'success' = 'form';
  let submitting = false;
  let completedTx: Transaction | null = null;

  $: plansForProvider = CABLE_PLANS.filter((p) => p.provider === provider);
  $: smartcardBeneficiaries = $beneficiaries.filter((b) => b.kind === 'smartcard');
  $: {
    if (selectedPlan && selectedPlan.provider !== provider) selectedPlan = null;
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
    if (!selectedPlan) return (error = 'Choose a package.');
    step = 'confirm';
  }

  function confirmPurchase() {
    error = '';
    submitting = true;
    setTimeout(() => {
      const plan = selectedPlan!;
      const result = purchaseService({
        type: 'cable',
        amount: plan.price,
        description: `${plan.packageName} · ${smartcardNumber}`,
        meta: { provider, smartcardNumber, planId: plan.id }
      });
      submitting = false;

      if (!result.ok) {
        error = result.error;
        step = 'form';
        return;
      }
      completedTx = result.transaction;
      showToast(`${plan.packageName} renewed for ${smartcardNumber}`);
      step = 'success';
    }, 500);
  }
</script>

<svelte:head><title>Cable TV subscription — Stefanx</title></svelte:head>

<PageHeader title="Cable TV" />

{#if step === 'form'}
  <div class="px-4 py-5">
    <p class="mb-2 text-xs font-medium text-ink/60">Provider</p>
    <div class="mb-5 grid grid-cols-3 gap-2">
      {#each providers as p}
        <button
          type="button"
          on:click={() => (provider = p)}
          class="rounded-xl border py-2.5 text-sm font-semibold transition"
          class:border-fanu-500={provider === p}
          class:bg-fanu-50={provider === p}
          class:border-fanu-100={provider !== p}
        >
          {p}
        </button>
      {/each}
    </div>

    <p class="mb-2 text-xs font-medium text-ink/60">Smartcard / IUC number</p>
    <BeneficiaryChips items={smartcardBeneficiaries} onSelect={pickBeneficiary} />
    <label class="mb-5 flex flex-col gap-1.5">
      <input
        type="text"
        bind:value={smartcardNumber}
        placeholder="e.g. 1234567890"
        class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500"
      />
    </label>

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
          <p class="font-mono text-sm font-semibold tabular-nums text-fanu-700">{formatNaira(plan.price)}</p>
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
      class="w-full rounded-xl bg-spark-500 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-spark-600"
    >
      Review
    </button>
  </div>
{:else if step === 'confirm' && selectedPlan}
  <PurchaseConfirm
    title="You're paying"
    amount={selectedPlan.price}
    amountLabel="Package price"
    rows={[
      { label: 'Provider', value: provider },
      { label: 'Package', value: selectedPlan.packageName },
      { label: 'Smartcard / IUC', value: smartcardNumber }
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
      <p class="font-display text-lg font-semibold text-ink">Subscription renewed</p>
      <p class="mt-1 text-sm text-ink/50">{selectedPlan?.packageName} for {smartcardNumber}</p>
    </div>

    {#if !isBeneficiarySaved('smartcard', smartcardNumber)}
      <div class="mb-5">
        <SaveBeneficiaryPrompt
          kind="smartcard"
          value={smartcardNumber}
          extra={provider}
          valueLabel={`smartcard ${smartcardNumber}`}
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
