<script lang="ts">
  import { serviceToggles } from '$lib/stores/serviceStatus';
  import ServiceUnavailable from '$lib/components/ServiceUnavailable.svelte';
  import { goto } from '$app/navigation';
  import { BULK_SMS_PACKAGES, type BulkSmsPackage } from '$lib/data/catalog';
  import { purchaseService, walletBalance } from '$lib/stores/db';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira, formatDate } from '$lib/format';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import PurchaseConfirm from '$lib/components/PurchaseConfirm.svelte';
  import TransactionReceipt from '$lib/components/TransactionReceipt.svelte';
  import type { Transaction } from '$lib/types';

  let selectedPackage: BulkSmsPackage | null = null;
  let senderName = '';
  let recipients = '';
  let message = '';
  let error = '';

  let step: 'form' | 'confirm' | 'success' | 'failed' = 'form';
  let submitting = false;
  let completedTx: Transaction | null = null;

  $: recipientList = recipients.split(/[\n,]+/).map(r => r.trim()).filter(r => r.length >= 11);
  $: recipientCount = recipientList.length;
  $: charCount = message.length;
  $: smsUnitsNeeded = selectedPackage ? Math.ceil(recipientCount / 1) : 0;

  function review() {
    error = '';
    if (!selectedPackage) return (error = 'Choose an SMS package.');
    if (!senderName.trim()) return (error = 'Enter a sender name (max 11 characters).');
    if (senderName.length > 11) return (error = 'Sender name must be 11 characters or fewer.');
    if (recipientCount === 0) return (error = 'Add at least one valid recipient number.');
    if (!message.trim()) return (error = 'Enter a message.');
    if (recipientCount > selectedPackage.units) return (error = `Your package covers ${selectedPackage.units.toLocaleString()} recipients — you've entered ${recipientCount}.`);
    step = 'confirm';
  }

  async function confirmPurchase() {
    error = '';
    submitting = true;
    // timeout removed — now truly async
    (async () => {
      const result = await purchaseService({
        type: 'bulk_sms',
        amount: selectedPackage!.price,
        description: `Bulk SMS · ${recipientCount} recipients · "${senderName}"`,
        meta: { senderName, recipientCount: String(recipientCount), units: String(selectedPackage!.units) }
      });
      submitting = false;

      if (!result.ok) { error = result.error; step = 'form'; return; }
      completedTx = result.transaction;
      if (result.transaction.status === 'failed') { step = 'failed'; return; }
      showToast(`SMS sent to ${recipientCount} recipients`);
      step = 'success';
    })();
  }
  $: serviceToggle = $serviceToggles.find(s => s.key === 'bulk_sms');
  $: serviceEnabled = serviceToggle?.isEnabled ?? true;
  $: serviceReason = serviceToggle?.disabledReason ?? '';

</script>

<svelte:head><title>Bulk SMS — Stefanx Data Services</title></svelte:head>

{#if step !== 'success' && step !== 'failed'}
  <PageHeader title="Bulk SMS" />
{/if}


{#if !serviceEnabled}
  <ServiceUnavailable label="Bulk SMS" reason={serviceReason} />
{:else}
{#if step === 'form'}
  <div class="px-4 py-5">
    <div class="mb-5 rounded-xl bg-fanu-50 px-4 py-3 text-xs text-fanu-800">
      Send SMS to multiple numbers at once. Rate: ₦2.5 kobo per unit. Packages never expire — unused units roll over.
    </div>

    <p class="mb-2 text-xs font-medium text-ink/60">Choose a package</p>
    <div class="mb-5 grid grid-cols-2 gap-2 md:grid-cols-3">
      {#each BULK_SMS_PACKAGES as pkg (pkg.id)}
        <button
          type="button"
          on:click={() => (selectedPackage = pkg)}
          class="rounded-xl border p-3 text-left transition"
          class:border-fanu-500={selectedPackage?.id === pkg.id}
          class:bg-fanu-50={selectedPackage?.id === pkg.id}
          class:border-fanu-100={selectedPackage?.id !== pkg.id}
        >
          <p class="font-mono text-sm font-semibold tabular-nums text-ink">{pkg.units.toLocaleString()} units</p>
          <p class="text-xs text-fanu-700">{formatNaira(pkg.price)}</p>
        </button>
      {/each}
    </div>

    <label class="mb-4 flex flex-col gap-1.5">
      <span class="text-xs font-medium text-ink/60">Sender name (max 11 characters)</span>
      <input type="text" bind:value={senderName} maxlength="11" placeholder="StefanxData" class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500" />
    </label>

    <label class="mb-4 flex flex-col gap-1.5">
      <span class="text-xs font-medium text-ink/60">Recipients (one number per line, or comma-separated)</span>
      <textarea bind:value={recipients} rows="4" placeholder="08012345678&#10;08087654321" class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500 font-mono"></textarea>
      <p class="text-[11px] text-ink/45">{recipientCount} valid numbers entered</p>
    </label>

    <label class="mb-1 flex flex-col gap-1.5">
      <span class="text-xs font-medium text-ink/60">Message</span>
      <textarea bind:value={message} rows="4" maxlength="160" placeholder="Type your message here…" class="rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500"></textarea>
    </label>
    <p class="mb-5 text-[11px] text-ink/45">{charCount}/160 characters · Wallet: {formatNaira($walletBalance)}</p>

    {#if error}<p class="mb-3 text-sm text-red-600">{error}</p>{/if}

    <button type="button" on:click={review} class="w-full rounded-xl bg-spark-500 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-spark-600">
      Review
    </button>
  </div>
{:else if step === 'confirm' && selectedPackage}
  <PurchaseConfirm
    title="You're sending"
    amount={selectedPackage.price}
    amountLabel="SMS package cost"
    confirmLabel="Send SMS"
    rows={[
      { label: 'Package', value: `${selectedPackage.units.toLocaleString()} units` },
      { label: 'Recipients', value: `${recipientCount} numbers` },
      { label: 'Sender name', value: senderName }
    ]}
    {submitting} {error}
    onConfirm={confirmPurchase}
    onBack={() => (step = 'form')}
  />
{:else if step === 'success' && completedTx && selectedPackage}
  <TransactionReceipt
    status="success"
    title="SMS Sent!"
    subtitle="Your bulk SMS has been queued for delivery"
    reference={completedTx.reference}
    rows={[
      { label: 'Recipients', value: `${recipientCount} numbers` },
      { label: 'Sender name', value: senderName },
      { label: 'Amount Charged', value: `-${formatNaira(completedTx.amount)}`, emphasis: true },
      { label: 'Transaction Date', value: formatDate(completedTx.createdAt) }
    ]}
    shareText={`Stefanx Bulk SMS receipt\nRecipients: ${recipientCount}\nRef: ${completedTx.reference}`}
    onDone={() => goto('/dashboard')}
    onBuyAgain={() => (step = 'form')}
  />
{:else if step === 'failed' && completedTx}
  <TransactionReceipt
    status="failed"
    title="SMS Failed"
    subtitle="Unable to send your bulk SMS. Please try again."
    reference={completedTx.reference}
    rows={[{ label: 'Recipients', value: `${recipientCount} numbers` }, { label: 'Amount', value: formatNaira(completedTx.amount) }]}
    shareText={`Stefanx Bulk SMS — Failed\nRef: ${completedTx.reference}`}
    onDone={() => goto('/dashboard')}
    onRetry={confirmPurchase}
    retrying={submitting}
  />
{/if}
{/if}
