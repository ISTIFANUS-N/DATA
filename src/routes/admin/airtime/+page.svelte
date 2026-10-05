<script lang="ts">
  import { airtimeSettings, adminUpdateAirtimeSetting } from '$lib/stores/catalog';
  import { NETWORKS } from '$lib/data/catalog';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira } from '$lib/format';
  import { airtimeCashback, saveSetting } from '$lib/stores/settings';
  import { CASHBACK_ENABLED, type AirtimeCashback } from '$lib/pricing';

  // Cashback per ₦100 of airtime. Local draft so typing doesn't save on every keystroke.
  let rateDraft: AirtimeCashback | null = null;
  let savingRates = false;
  $: if (!rateDraft) rateDraft = JSON.parse(JSON.stringify($airtimeCashback));

  function setRate(network: string, pkg: 'smart_user' | 'reseller', value: string) {
    if (!rateDraft) return;
    rateDraft = { ...rateDraft, [network]: { ...rateDraft[network], [pkg]: Number(value) } };
  }

  async function saveRates() {
    if (!rateDraft) return;
    for (const [net, r] of Object.entries(rateDraft)) {
      for (const v of [r.smart_user, r.reseller]) {
        if (!Number.isFinite(v) || v < 0 || v > 20) {
          showToast(`${net}: enter cashback between ₦0 and ₦20 per ₦100`, 'error'); return;
        }
      }
    }
    savingRates = true;
    const res = await saveSetting('airtime_cashback', rateDraft);
    savingRates = false;
    if (res.ok) { showToast('Airtime cashback saved'); rateDraft = null; }
    else showToast(res.error, 'error');
  }

  let drafts: Record<string, { minAmount: number; maxAmount: number }> = {};

  function getNetwork(code: string) { return NETWORKS.find((n) => n.code === code); }

  function save(network: string) {
    const d = drafts[network];
    if (!d) return;
    adminUpdateAirtimeSetting(network, d);
    showToast(`${network} airtime settings saved`);
    delete drafts[network];
  }

  function toggleActive(network: string, val: boolean) {
    adminUpdateAirtimeSetting(network, { isActive: val });
    showToast(`${network} airtime ${val ? 'enabled' : 'disabled'}`);
  }
</script>

<svelte:head><title>Airtime settings — Admin</title></svelte:head>

<h1 class="mb-2 font-display text-xl font-bold text-ink">Airtime settings</h1>
<p class="mb-6 text-sm text-ink/55">Set min/max limits and on/off per network.</p>

{#if CASHBACK_ENABLED}
<div class="mb-6 rounded-2xl bg-white p-4 shadow-sm">
  <p class="text-sm font-semibold text-ink">Cashback per ₦100 airtime</p>
  <p class="mb-3 text-[11px] text-ink/50">
    Customers always pay full price. Enter the cashback they get back in their wallet for every ₦100 of airtime,
    paid once the airtime is delivered. For example 2 means ₦20 back on ₦1,000. Use 0 for no cashback.
    Cashback is automatically limited to your profit on each order, so it can never cause a loss
    (your profit = what the customer pays minus what the provider charges you).
  </p>
  {#if rateDraft}
    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-left text-ink/45">
            <th class="pb-2 font-medium">Network</th>
            <th class="pb-2 font-medium">Smart user (₦)</th>
            <th class="pb-2 font-medium">Reseller (₦)</th>
          </tr>
        </thead>
        <tbody>
          {#each Object.keys(rateDraft) as net}
            <tr class="border-t border-fanu-50">
              <td class="py-2 font-semibold text-ink">{getNetwork(net)?.label ?? net}</td>
              <td class="py-2 pr-2">
                <input type="number" min="0" max="20" step="0.1" value={rateDraft[net].smart_user}
                  on:input={(e) => setRate(net, 'smart_user', e.currentTarget.value)}
                  class="w-24 rounded-lg border border-fanu-100 px-2.5 py-1.5 text-sm" />
              </td>
              <td class="py-2">
                <input type="number" min="0" max="20" step="0.1" value={rateDraft[net].reseller}
                  on:input={(e) => setRate(net, 'reseller', e.currentTarget.value)}
                  class="w-24 rounded-lg border border-fanu-100 px-2.5 py-1.5 text-sm" />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <button type="button" on:click={saveRates} disabled={savingRates}
      class="mt-3 rounded-lg bg-fanu-600 px-4 py-2 text-xs font-semibold text-white hover:bg-fanu-700 disabled:opacity-60">
      {savingRates ? 'Saving…' : 'Save cashback'}
    </button>
  {/if}
</div>
{:else}
<div class="mb-6 rounded-2xl border border-fanu-100 bg-fanu-50 px-4 py-3 text-xs text-ink/70">
  Cashback is switched off for now. Customers pay the normal price and no cashback is given.
</div>
{/if}

<div class="overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each $airtimeSettings as setting (setting.network)}
    {@const net = getNetwork(setting.network)}
    <div class="border-b border-fanu-50 px-4 py-4 last:border-0">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="h-5 w-5 rounded-full" style="background:{net?.color ?? '#ccc'}"></span>
          <p class="font-semibold text-ink">{net?.label ?? setting.network}</p>
        </div>
        <label class="flex cursor-pointer items-center gap-2">
          <span class="text-xs text-ink/50">{setting.isActive ? 'Active' : 'Disabled'}</span>
          <input type="checkbox" checked={setting.isActive} on:change={(e) => toggleActive(setting.network, e.currentTarget.checked)} class="h-4 w-4 accent-fanu-600" />
        </label>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <label class="flex flex-col gap-1 text-xs">
          <span class="font-medium text-ink/60">Min amount (₦)</span>
          <input type="number" min="0" value={drafts[setting.network]?.minAmount ?? setting.minAmount}
            on:input={(e) => (drafts[setting.network] = { ...(drafts[setting.network] ?? { minAmount: setting.minAmount, maxAmount: setting.maxAmount }), minAmount: +e.currentTarget.value })}
            class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" />
        </label>
        <label class="flex flex-col gap-1 text-xs">
          <span class="font-medium text-ink/60">Max amount (₦)</span>
          <input type="number" min="0" value={drafts[setting.network]?.maxAmount ?? setting.maxAmount}
            on:input={(e) => (drafts[setting.network] = { ...(drafts[setting.network] ?? { minAmount: setting.minAmount, maxAmount: setting.maxAmount }), maxAmount: +e.currentTarget.value })}
            class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" />
        </label>
      </div>
      {#if drafts[setting.network]}
        <button type="button" on:click={() => save(setting.network)} class="mt-2 rounded-lg bg-fanu-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-fanu-700">Save</button>
      {/if}
    </div>
  {/each}
</div>
