<script lang="ts">
  import { serviceToggles } from '$lib/stores/serviceStatus';
  import ServiceUnavailable from '$lib/components/ServiceUnavailable.svelte';
  import { goto } from '$app/navigation';
  import { NETWORKS, type Network } from '$lib/data/catalog';
    import { purchaseService, walletBalance, currentProfile, beneficiaries, isBeneficiarySaved } from '$lib/stores/db';
  const AIRTIME_TO_CASH_RATE = 0.85;
  import { detectNetwork, normalizePhone } from '$lib/network';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira } from '$lib/format';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import PurchaseConfirm from '$lib/components/PurchaseConfirm.svelte';
  import SaveBeneficiaryPrompt from '$lib/components/SaveBeneficiaryPrompt.svelte';
  import BeneficiaryChips from '$lib/components/BeneficiaryChips.svelte';
  import ToggleSwitch from '$lib/components/ToggleSwitch.svelte';
  import type { Beneficiary, Transaction } from '$lib/types';

  let network: Network | null = null;
  let phoneNumber = '';
  let amount: number | null = null;
  let error = '';
  let autoDetect = true;
  let detectionMissed = false;

  let step: 'form' | 'confirm' | 'success' = 'form';
  let submitting = false;
  let completedTx: Transaction | null = null;

  $: payout = amount ? Math.round(amount * AIRTIME_TO_CASH_RATE) : 0;
  $: phoneBeneficiaries = $beneficiaries.filter((b) => b.kind === 'phone');

  $: if (autoDetect) {
    const detected = detectNetwork(phoneNumber);
    if (detected) {
      network = detected;
      detectionMissed = false;
    } else {
      detectionMissed = normalizePhone(phoneNumber).length >= 11;
    }
  }

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
    if (!amount || amount < 200) return (error = 'Minimum conversion amount is ₦200.');
    step = 'confirm';
  }

  async function confirmRequest() {
    error = '';
    submitting = true;
    const result = await purchaseService({
      type: 'airtime_to_cash',
      amount: payout,
      description: `Airtime to cash — ₦${amount} → ₦${payout} · ${phoneNumber}`,
      meta: { network: network ?? '', phoneNumber }
    });
    submitting = false;
    if (!result.ok) { error = result.error; step = 'form'; return; }
    completedTx = result.transaction;
    showToast('Request submitted — awaiting confirmation');
    step = 'success';
  }
  $: serviceToggle = $serviceToggles.find(s => s.key === 'airtime_to_cash');
  $: serviceEnabled = serviceToggle?.isEnabled ?? true;
  $: serviceReason = serviceToggle?.disabledReason ?? '';

</script>

<svelte:head><title>Airtime to cash — Stefanx</title></svelte:head>

{#if step !== 'success'}
  <PageHeader title="Airtime to cash" />
{/if}


{#if !serviceEnabled}
  <ServiceUnavailable label="Airtime to cash" reason={serviceReason} />
{:else}

{#if step === 'form'}
  <div class="px-4 py-5">
    <div class="mb-5 rounded-xl bg-fanu-50 px-4 py-3 text-xs text-fanu-800">
      Convert unused airtime into wallet cash at {Math.round(AIRTIME_TO_CASH_RATE * 100)}% of its
      value. Requests are reviewed before your wallet is credited — this isn't instant.
    </div>

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

    <p class="mb-2 text-xs font-medium text-ink/60">Phone number airtime is sent from</p>
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

    <label class="mb-1 flex flex-col gap-1.5">
      <span class="text-xs font-medium text-ink/60">Airtime amount to convert</span>
      <input
        type="number"
        min="200"
        bind:value={amount}
        placeholder="₦ Amount"
        class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500"
      />
    </label>
    {#if amount}
      <p class="mb-5 mt-1.5 text-xs text-ink/50">
        You'll receive <span class="font-semibold text-fanu-700">{formatNaira(payout)}</span> once confirmed
      </p>
    {:else}
      <p class="mb-5"></p>
    {/if}

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
    title="You'll receive"
    amount={payout}
    amountLabel={`${Math.round(AIRTIME_TO_CASH_RATE * 100)}% of ${formatNaira(amount ?? 0)}`}
    confirmLabel="Submit request"
    rows={[
      { label: 'Network', value: network ?? '' },
      { label: 'Phone number', value: phoneNumber },
      { label: 'Airtime amount', value: formatNaira(amount ?? 0) }
    ]}
    {submitting}
    {error}
    onConfirm={confirmRequest}
    onBack={() => (step = 'form')}
  />
{:else if step === 'success' && completedTx}
  <div class="px-4 py-5">
    <div class="mb-5 rounded-2xl bg-white p-6 text-center shadow-sm">
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-2xl">⏳</div>
      <p class="font-display text-lg font-semibold text-ink">Request submitted</p>
      <p class="mt-1 text-sm text-ink/50">
        {formatNaira(completedTx.amount)} will be credited once your {network} airtime is confirmed
      </p>
      <p class="mt-3 text-xs text-ink/40">Track this in Transaction history — it'll show as Pending until then.</p>
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
{/if}
