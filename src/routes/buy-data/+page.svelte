<script lang="ts">
  import { serviceToggles } from '$lib/stores/serviceStatus';
  import ServiceUnavailable from '$lib/components/ServiceUnavailable.svelte';
  import { goto } from '$app/navigation';
  import { NETWORKS, DATA_PLAN_TYPES, planSizeLabel, type Network, type DataPlan, type DataPlanType } from '$lib/data/catalog';
  import { dataPlans } from '$lib/stores/catalog';
  import { purchaseService, walletBalance, beneficiaries, isBeneficiarySaved, currentProfile } from '$lib/stores/db';
  import { detectNetwork, normalizePhone } from '$lib/network';
  import { applyPackagePricing, packageLabel } from '$lib/pricing';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira, formatDate } from '$lib/format';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import PurchaseConfirm from '$lib/components/PurchaseConfirm.svelte';
  import SaveBeneficiaryPrompt from '$lib/components/SaveBeneficiaryPrompt.svelte';
  import BeneficiaryChips from '$lib/components/BeneficiaryChips.svelte';
  import ToggleSwitch from '$lib/components/ToggleSwitch.svelte';
  import TransactionReceipt from '$lib/components/TransactionReceipt.svelte';
  import NetworkLogo from '$lib/components/NetworkLogo.svelte';
  import type { Beneficiary, Transaction } from '$lib/types';

  let network: Network = 'MTN';
  let planType: DataPlanType = 'SME';
  let phoneNumber = '';
  let selectedPlan: DataPlan | null = null;
  let confirmedPlan: DataPlan | null = null;
  let error = '';
  let autoDetect = true;
  let detectionMissed = false;

  let step: 'form' | 'confirm' | 'success' | 'failed' = 'form';
  let submitting = false;
  let completedTx: Transaction | null = null;

  $: serviceToggle = $serviceToggles.find(s => s.key === 'data');
  $: serviceEnabled = serviceToggle?.isEnabled ?? true;
  $: serviceReason = serviceToggle?.disabledReason ?? 'This service is temporarily unavailable.';

  $: plansForSelection = $dataPlans.filter(p => p.network === network && p.type === planType && p.isActive);
  $: phoneBeneficiaries = $beneficiaries.filter(b => b.kind === 'phone');
  $: pkg = $currentProfile?.package ?? 'smart_user';
  $: chargedPrice = selectedPlan ? applyPackagePricing(selectedPlan.price, 'data', pkg) : 0;

  $: if (autoDetect) {
    const detected = detectNetwork(phoneNumber);
    if (detected) { network = detected; detectionMissed = false; }
    else { detectionMissed = normalizePhone(phoneNumber).length >= 11; }
  }
  $: { const cleaned = normalizePhone(phoneNumber); if (cleaned !== phoneNumber && /^0\d{10}$/.test(cleaned)) phoneNumber = cleaned; }
  $: { if (selectedPlan && (selectedPlan.network !== network || selectedPlan.type !== planType)) selectedPlan = null; }

  function pickNetworkManually(code: Network) { network = code; autoDetect = false; }
  function pickBeneficiary(b: Beneficiary) {
    phoneNumber = b.value;
    if (b.extra && NETWORKS.some(n => n.code === b.extra)) { network = b.extra as Network; autoDetect = false; }
  }
  function review() {
    error = '';
    if (!/^0\d{10}$/.test(phoneNumber)) return (error = 'Enter a valid 11-digit phone number.');
    if (!selectedPlan) return (error = 'Choose a data plan.');
    step = 'confirm';
  }
  async function confirmPurchase() {
    error = ''; submitting = true;
    const plan = confirmedPlan ?? selectedPlan!;
    confirmedPlan = plan;
    // timeout removed — now truly async
    (async () => {
      const result = await purchaseService({ type: 'data', amount: applyPackagePricing(plan.price, 'data', pkg),
        description: `${planSizeLabel(plan)} · ${plan.validity} · ${phoneNumber}`,
        meta: { network, phoneNumber, planId: plan.id, apiPlanId: plan.apiPlanId, planType: plan.type } });
      submitting = false;
      if (!result.ok) { error = result.error; step = 'form'; return; }
      completedTx = result.transaction;
      if (result.transaction.status === 'failed') { step = 'failed'; } else { showToast(`${planSizeLabel(plan)} sent to ${phoneNumber}`); step = 'success'; }
    })();
  }
  function resetForm() { phoneNumber = ''; selectedPlan = null; confirmedPlan = null; completedTx = null; step = 'form'; }
</script>

<svelte:head><title>Buy data — Stefanx Data Services</title></svelte:head>

{#if !serviceEnabled}
  <ServiceUnavailable label="Data" reason={serviceReason} />
{:else}

{#if step !== 'success' && step !== 'failed'}
  <PageHeader title="Buy data" />
{/if}

{#if step === 'form'}
<div class="px-4 py-4">

  <!-- Auto-detect toggle -->
  <div class="mb-4">
    <ToggleSwitch checked={autoDetect} label="Auto-detect network"
      description="Turn off if a number has been ported to another network"
      onChange={(v) => (autoDetect = v)} />
  </div>

  <!-- Network selector with logos -->
  <p class="mb-2 text-xs font-semibold text-ink/50">Network</p>
  <div class="mb-1 grid grid-cols-4 gap-2">
    {#each NETWORKS as n}
      <button type="button" on:click={() => pickNetworkManually(n.code)}
        class="flex flex-col items-center gap-1.5 rounded-xl border py-2.5 transition"
        class:border-fanu-500={network === n.code}
        style={network === n.code ? `background:${n.bgColor}` : ''}
        class:border-fanu-100={network !== n.code}
      >
        <NetworkLogo network={n.code} size="sm" />
        <span class="text-[10px] font-bold text-ink">{n.label}</span>
      </button>
    {/each}
  </div>
  {#if autoDetect && network}
    <p class="mb-3 text-[11px] text-fanu-700">↑ Detected from number below</p>
  {:else if detectionMissed}
    <p class="mb-3 text-[11px] text-amber-700">Couldn't detect — select a network above</p>
  {:else}
    <div class="mb-3"></div>
  {/if}

  <!-- Phone number -->
  <p class="mb-2 text-xs font-semibold text-ink/50">Phone number</p>
  <BeneficiaryChips items={phoneBeneficiaries} onSelect={pickBeneficiary} />
  <input type="tel" bind:value={phoneNumber} placeholder="08012345678"
    class="mb-4 w-full rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500" />

  <!-- Plan type filter pills -->
  <p class="mb-2 text-xs font-semibold text-ink/50">Plan type</p>
  <div class="mb-1 flex gap-2 overflow-x-auto pb-1">
    {#each DATA_PLAN_TYPES as t}
      <button type="button" on:click={() => (planType = t.code)}
        class="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition"
        class:bg-fanu-600={planType === t.code} class:text-white={planType === t.code} class:border-fanu-600={planType === t.code}
        class:border-fanu-100={planType !== t.code} class:text-ink={planType !== t.code}
      >{t.label}</button>
    {/each}
  </div>
  <p class="mb-4 text-[11px] text-ink/40">{DATA_PLAN_TYPES.find(t => t.code === planType)?.blurb}</p>

  <!-- Plans grid under network header -->
  <div class="mb-5">
    {#each NETWORKS.filter(n => n.code === network) as net}
      <div class="mb-2 flex items-center gap-2">
        <NetworkLogo network={net.code} size="sm" />
        <p class="text-sm font-bold text-ink">{net.label} · {DATA_PLAN_TYPES.find(t => t.code === planType)?.label}</p>
      </div>
    {/each}

    {#if plansForSelection.length === 0}
      <div class="rounded-2xl bg-white px-4 py-8 text-center text-sm text-ink/40 shadow-sm">
        No {DATA_PLAN_TYPES.find(t => t.code === planType)?.label} plans available for {network} right now.
      </div>
    {:else}
      <div class="grid grid-cols-3 gap-2 md:grid-cols-4">
        {#each plansForSelection as plan (plan.id)}
          <button type="button" on:click={() => (selectedPlan = plan)}
            class="flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition"
            class:border-fanu-600={selectedPlan?.id === plan.id}
            class:shadow-md={selectedPlan?.id === plan.id}
            class:border-fanu-100={selectedPlan?.id !== plan.id}
            style={selectedPlan?.id === plan.id ? `background:${NETWORKS.find(n=>n.code===network)?.bgColor}` : 'background:#fff'}
          >
            <p class="font-display text-lg font-bold leading-none text-ink">{plan.sizeValue}</p>
            <p class="text-[10px] font-bold text-ink/50">{plan.sizeUnit}</p>
            <p class="mt-1 text-[10px] text-ink/40">{plan.validity}</p>
            <p class="mt-1 font-mono text-xs font-bold text-fanu-700">{formatNaira(applyPackagePricing(plan.price, 'data', pkg))}</p>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <p class="mb-4 text-[11px] text-ink/40">Wallet: {formatNaira($walletBalance)}</p>
  {#if error}<p class="mb-3 text-sm text-red-600">{error}</p>{/if}
  <button type="button" on:click={review}
    class="w-full rounded-xl bg-spark-500 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-spark-600">
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
      { label: 'Plan type', value: DATA_PLAN_TYPES.find(t => t.code === planType)?.label ?? '' },
      { label: 'Plan', value: `${planSizeLabel(selectedPlan)} · ${selectedPlan.validity}` },
      { label: 'API Plan ID', value: selectedPlan.apiPlanId },
      { label: 'Phone number', value: phoneNumber }
    ]}
    {submitting} {error}
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
      { label: 'Network', value: network },
      { label: 'Plan', value: `${planSizeLabel(confirmedPlan)} · ${confirmedPlan.validity}` },
      { label: 'Recipient', value: phoneNumber },
      { label: 'Amount Charged', value: `-${formatNaira(completedTx.amount)}`, emphasis: true },
      { label: 'Transaction Date', value: formatDate(completedTx.createdAt) }
    ]}
    shareText={`Stefanx receipt\n${network} ${planSizeLabel(confirmedPlan)}\nTo: ${phoneNumber}\nAmount: ${formatNaira(completedTx.amount)}\nRef: ${completedTx.reference}`}
    onDone={() => goto('/dashboard')} onBuyAgain={resetForm}
  />
  {#if !isBeneficiarySaved('phone', phoneNumber)}
    <div class="mx-auto mb-6 max-w-sm px-4">
      <SaveBeneficiaryPrompt kind="phone" value={phoneNumber} extra={network} valueLabel={phoneNumber} onDone={() => {}} />
    </div>
  {/if}

{:else if step === 'failed' && completedTx && confirmedPlan}
  <TransactionReceipt
    status="failed"
    title="Transaction Failed"
    subtitle="Unable to complete your data purchase. Please try again."
    reference={completedTx.reference}
    rows={[
      { label: 'Network', value: network },
      { label: 'Plan', value: `${planSizeLabel(confirmedPlan)} · ${confirmedPlan.validity}` },
      { label: 'Recipient', value: phoneNumber },
      { label: 'Amount', value: formatNaira(completedTx.amount) }
    ]}
    shareText={`Stefanx — Failed\n${network} ${planSizeLabel(confirmedPlan)}\nRef: ${completedTx.reference}`}
    onDone={() => goto('/dashboard')} onRetry={confirmPurchase} retrying={submitting}
  />
{/if}

{/if}
