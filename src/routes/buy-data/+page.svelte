<script lang="ts">
  import { goto } from '$app/navigation';
  import { NETWORKS, DATA_PLANS, DATA_PLAN_TYPES, type Network, type DataPlan, type DataPlanType } from '$lib/data/catalog';
  import { purchaseService, walletBalance, beneficiaries, isBeneficiarySaved, currentProfile } from '$lib/stores/db';
  import { detectNetwork } from '$lib/network';
  import { applyPackagePricing, packageLabel } from '$lib/pricing';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira, formatDate } from '$lib/format';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import PurchaseConfirm from '$lib/components/PurchaseConfirm.svelte';
  import SaveBeneficiaryPrompt from '$lib/components/SaveBeneficiaryPrompt.svelte';
  import BeneficiaryChips from '$lib/components/BeneficiaryChips.svelte';
  import ToggleSwitch from '$lib/components/ToggleSwitch.svelte';
  import TransactionReceipt from '$lib/components/TransactionReceipt.svelte';
  import type { Beneficiary, Transaction } from '$lib/types';

  let network: Network = 'MTN';
  let planType: DataPlanType = 'GIFTING';
  let phoneNumber = '';
  let selectedPlan: DataPlan | null = null;
  let confirmedPlan: DataPlan | null = null;
  let error = '';
  let autoDetect = true;
  let detectionMissed = false;

  let step: 'form' | 'confirm' | 'success' | 'failed' = 'form';
  let submitting = false;
  let completedTx: Transaction | null = null;

  $: plansForSelection = DATA_PLANS.filter((p) => p.network === network && p.type === planType);
  $: phoneBeneficiaries = $beneficiaries.filter((b) => b.kind === 'phone');
  $: pkg = $currentProfile?.package ?? 'smart_user';
  $: chargedPrice = selectedPlan ? applyPackagePricing(selectedPlan.price, 'data', pkg) : 0;

  $: if (autoDetect && phoneNumber.length === 11) {
    const detected = detectNetwork(phoneNumber);
    if (detected) {
      network = detected;
      detectionMissed = false;
    } else {
      detectionMissed = true;
    }
  } else if (phoneNumber.length < 11) {
    detectionMissed = false;
  }

  $: {
    if (selectedPlan && (selectedPlan.network !== network || selectedPlan.type !== planType)) selectedPlan = null;
  }

  function pickNetworkManually(code: Network) {
    network = code;
    autoDetect = false;
  }

  function pickBeneficiary(b: Beneficiary) {
    phoneNumber = b.value;
    if (b.extra && NETWORKS.some((n) => n.code === b.extra)) {
      network = b.extra as Network;
      autoDetect = false;
    }
  }

  function review() {
    error = '';
    if (!/^0\d{10}$/.test(phoneNumber)) return (error = 'Enter a valid 11-digit phone number.');
    if (!selectedPlan) return (error = 'Choose a data plan.');
    step = 'confirm';
  }

  function confirmPurchase() {
    error = '';
    submitting = true;
    const plan = confirmedPlan ?? selectedPlan!;
    confirmedPlan = plan;
    setTimeout(() => {
      const result = purchaseService({
        type: 'data',
        amount: applyPackagePricing(plan.price, 'data', pkg),
        description: `${plan.planName} (${plan.size}, ${plan.validity}) · ${phoneNumber}`,
        meta: { network, phoneNumber, planId: plan.id, planType: plan.type }
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
        showToast(`${plan.planName} sent to ${phoneNumber}`);
        step = 'success';
      }
    }, 700);
  }

  function resetForm() {
    phoneNumber = '';
    selectedPlan = null;
    confirmedPlan = null;
    completedTx = null;
    step = 'form';
  }
</script>

<svelte:head><title>Buy data — Stefanx</title></svelte:head>

{#if step !== 'success' && step !== 'failed'}
  <PageHeader title="Buy data" />
{/if}

{#if step === 'form'}
  <div class="px-4 py-5">
    <div class="mb-3">
      <ToggleSwitch
        checked={autoDetect}
        label="Auto-detect network"
        description="Turn off if a number has been ported to another network"
        onChange={(v) => (autoDetect = v)}
      />
    </div>

    <p class="mb-2 text-xs font-medium text-ink/60">Network</p>
    <div class="mb-2 grid grid-cols-4 gap-2">
      {#each NETWORKS as n}
        <button
          type="button"
          on:click={() => pickNetworkManually(n.code)}
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
    {#if autoDetect && network}
      <p class="mb-3 text-[11px] text-fanu-700">Detected automatically from the number below</p>
    {:else if detectionMissed}
      <p class="mb-3 text-[11px] text-amber-700">Couldn't detect a network for this number — select one above</p>
    {:else}
      <div class="mb-3"></div>
    {/if}

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

    <p class="mb-2 text-xs font-medium text-ink/60">Plan type</p>
    <div class="mb-2 flex gap-2 overflow-x-auto pb-1">
      {#each DATA_PLAN_TYPES as t}
        <button
          type="button"
          on:click={() => (planType = t.code)}
          class="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition"
          class:border-fanu-500={planType === t.code}
          class:bg-fanu-600={planType === t.code}
          class:text-white={planType === t.code}
          class:border-fanu-100={planType !== t.code}
          class:text-ink={planType !== t.code}
        >
          {t.label}
        </button>
      {/each}
    </div>
    <p class="mb-4 text-[11px] text-ink/45">
      {DATA_PLAN_TYPES.find((t) => t.code === planType)?.blurb}
    </p>

    <p class="mb-2 text-xs font-medium text-ink/60">Choose a plan</p>
    <div class="mb-5 flex flex-col gap-2">
      {#each plansForSelection as plan (plan.id)}
        <button
          type="button"
          on:click={() => (selectedPlan = plan)}
          class="flex items-center justify-between rounded-xl border px-4 py-3 text-left transition"
          class:border-fanu-500={selectedPlan?.id === plan.id}
          class:bg-fanu-50={selectedPlan?.id === plan.id}
          class:border-fanu-100={selectedPlan?.id !== plan.id}
        >
          <div>
            <p class="text-sm font-semibold text-ink">{plan.size} · {plan.validity}</p>
            <p class="text-[11px] text-ink/45">{plan.planName}</p>
          </div>
          <p class="font-mono text-sm font-semibold tabular-nums text-fanu-700">
            {formatNaira(applyPackagePricing(plan.price, 'data', pkg))}
          </p>
        </button>
      {:else}
        <p class="rounded-xl bg-white px-4 py-6 text-center text-xs text-ink/40 shadow-sm">
          No {DATA_PLAN_TYPES.find((t) => t.code === planType)?.label} plans for {network} yet.
        </p>
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
    title="You're buying"
    amount={chargedPrice}
    amountLabel={pkg === 'reseller' ? `Reseller price · ${packageLabel(pkg)}` : 'Data plan price'}
    rows={[
      { label: 'Network', value: network },
      { label: 'Plan type', value: DATA_PLAN_TYPES.find((t) => t.code === planType)?.label ?? '' },
      { label: 'Plan', value: `${selectedPlan.size} · ${selectedPlan.validity}` },
      { label: 'Phone number', value: phoneNumber }
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
    subtitle="Your data has been credited instantly"
    reference={completedTx.reference}
    rows={[
      { label: 'Service / Product', value: `${network} ${confirmedPlan.size} Data` },
      { label: 'Recipient', value: phoneNumber },
      { label: 'Amount Charged', value: `-${formatNaira(completedTx.amount)}`, emphasis: true },
      { label: 'Transaction Date', value: formatDate(completedTx.createdAt) }
    ]}
    shareText={`FANU receipt\n${network} ${confirmedPlan.size} Data\nTo: ${phoneNumber}\nAmount: ${formatNaira(completedTx.amount)}\nRef: ${completedTx.reference}`}
    onDone={() => goto('/dashboard')}
    onBuyAgain={resetForm}
  />
  {#if !isBeneficiarySaved('phone', phoneNumber)}
    <div class="mx-auto mb-6 max-w-sm px-4">
      <SaveBeneficiaryPrompt
        kind="phone"
        value={phoneNumber}
        extra={network}
        valueLabel={phoneNumber}
        onDone={() => {}}
      />
    </div>
  {/if}
{:else if step === 'failed' && completedTx && confirmedPlan}
  <TransactionReceipt
    status="failed"
    title="Transaction Failed"
    subtitle="Unable to complete your data purchase. Please try again."
    reference={completedTx.reference}
    rows={[
      { label: 'Service / Product', value: `${network} ${confirmedPlan.size} Data` },
      { label: 'Recipient', value: phoneNumber },
      { label: 'Amount', value: formatNaira(completedTx.amount) }
    ]}
    shareText={`FANU receipt\n${network} ${confirmedPlan.size} Data — Failed\nTo: ${phoneNumber}\nRef: ${completedTx.reference}`}
    onDone={() => goto('/dashboard')}
    onRetry={confirmPurchase}
    retrying={submitting}
  />
{/if}
