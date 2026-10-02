<script lang="ts">
  import { serviceToggles } from '$lib/stores/serviceStatus';
  import ServiceUnavailable from '$lib/components/ServiceUnavailable.svelte';
  import { goto } from '$app/navigation';
  import { NETWORKS, type Network } from '$lib/data/catalog';
  import { purchaseService, walletBalance, beneficiaries, isBeneficiarySaved, currentProfile } from '$lib/stores/db';
  import { detectNetwork, normalizePhone } from '$lib/network';
  import { airtimeCashback } from '$lib/pricing';
  import { airtimeCashback as cashbackRates } from '$lib/stores/settings';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira, formatDate } from '$lib/format';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import PurchaseConfirm from '$lib/components/PurchaseConfirm.svelte';
  import SaveBeneficiaryPrompt from '$lib/components/SaveBeneficiaryPrompt.svelte';
  import BeneficiaryChips from '$lib/components/BeneficiaryChips.svelte';
  import ToggleSwitch from '$lib/components/ToggleSwitch.svelte';
  import TransactionReceipt from '$lib/components/TransactionReceipt.svelte';
  import type { Beneficiary, Transaction } from '$lib/types';

  const presets = [100, 200, 500, 1000, 2000, 5000];

  let network: Network | null = null;
  let phoneNumber = '';
  let amount: number | null = null;
  let error = '';
  let autoDetect = true;
  let detectionMissed = false;

  let step: 'form' | 'confirm' | 'success' | 'failed' = 'form';
  let submitting = false;
  let completedTx: Transaction | null = null;

  $: phoneBeneficiaries = $beneficiaries.filter((b) => b.kind === 'phone');
  $: pkg = $currentProfile?.package ?? 'smart_user';
  // Full price is charged; cashback (if any) is paid into the wallet after delivery.
  $: expectedCashback = amount ? airtimeCashback(amount, network, pkg, $cashbackRates) : 0;

  $: if (autoDetect) {
    const detected = detectNetwork(phoneNumber);
    if (detected) {
      network = detected;
      detectionMissed = false;
    } else {
      detectionMissed = normalizePhone(phoneNumber).length >= 11;
    }
  }

  // Independent of auto-detect: cleans up pasted numbers (spaces,
  // +234 prefix, missing leading 0) into the plain local format, so
  // the strict validation below and the final submission both see a
  // consistent value.
  $: {
    const cleaned = normalizePhone(phoneNumber);
    if (cleaned !== phoneNumber && /^0\d{10}$/.test(cleaned)) {
      phoneNumber = cleaned;
    }
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
    if (!network) return (error = 'Choose a network.');
    if (!/^0\d{10}$/.test(phoneNumber)) return (error = 'Enter a valid 11-digit phone number.');
    if (!amount || amount < 50) return (error = 'Minimum airtime purchase is ₦50.');
    step = 'confirm';
  }

  async function confirmPurchase() {
    error = '';
    submitting = true;
    // timeout removed — now truly async
    (async () => {
      const result = await purchaseService({
        type: 'airtime',
        amount: amount!,
        description: `${network} airtime · ${phoneNumber}`,
        meta: { network: network!, phoneNumber, faceAmount: String(amount) }
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
        showToast(result.cashback
          ? `${formatNaira(amount!)} airtime sent to ${phoneNumber} · ${formatNaira(result.cashback)} cashback added`
          : `${formatNaira(amount!)} airtime sent to ${phoneNumber}`);
        step = 'success';
      }
    })();
  }

  function resetForm() {
    phoneNumber = '';
    amount = null;
    completedTx = null;
    step = 'form';
  }
  $: serviceToggle = $serviceToggles.find(s => s.key === 'airtime');
  $: serviceEnabled = serviceToggle?.isEnabled ?? true;
  $: serviceReason = serviceToggle?.disabledReason ?? '';

</script>

<svelte:head><title>Buy airtime — Stefanx</title></svelte:head>

{#if step !== 'success' && step !== 'failed'}
  <PageHeader title="Buy airtime" />
{/if}


{#if !serviceEnabled}
  <ServiceUnavailable label="Airtime" reason={serviceReason} />
{:else}
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
    {#if expectedCashback > 0}
      <p class="mb-1 text-[11px] text-fanu-700">💰 You'll get {formatNaira(expectedCashback)} cashback in your wallet</p>
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
    title="You're buying"
    amount={amount ?? 0}
    amountLabel={expectedCashback > 0 ? `Airtime amount · ${formatNaira(expectedCashback)} cashback after delivery` : 'Airtime amount'}
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
  <TransactionReceipt
    status="success"
    title="Purchase Successful!"
    subtitle="Your airtime has been credited instantly"
    reference={completedTx.reference}
    rows={[
      { label: 'Service / Product', value: `${network} Airtime` },
      { label: 'Recipient', value: phoneNumber },
      { label: 'Amount Charged', value: `-${formatNaira(completedTx.amount)}`, emphasis: true },
      { label: 'Transaction Date', value: formatDate(completedTx.createdAt) }
    ]}
    shareText={`FANU receipt\n${network} Airtime\nTo: ${phoneNumber}\nAmount: ${formatNaira(completedTx.amount)}\nRef: ${completedTx.reference}`}
    onDone={() => goto('/dashboard')}
    onBuyAgain={resetForm}
  />
  {#if !isBeneficiarySaved('phone', phoneNumber)}
    <div class="mx-auto mb-6 max-w-sm px-4">
      <SaveBeneficiaryPrompt
        kind="phone"
        value={phoneNumber}
        extra={network ?? undefined}
        valueLabel={phoneNumber}
        onDone={() => {}}
      />
    </div>
  {/if}
{:else if step === 'failed' && completedTx}
  <TransactionReceipt
    status="failed"
    title="Transaction Failed"
    subtitle="Unable to complete your airtime purchase. Please try again."
    reference={completedTx.reference}
    rows={[
      { label: 'Service / Product', value: `${network} Airtime` },
      { label: 'Recipient', value: phoneNumber },
      { label: 'Amount', value: formatNaira(completedTx.amount) }
    ]}
    shareText={`FANU receipt\n${network} Airtime — Failed\nTo: ${phoneNumber}\nRef: ${completedTx.reference}`}
    onDone={() => goto('/dashboard')}
    onRetry={confirmPurchase}
    retrying={submitting}
  />
{/if}
{/if}
