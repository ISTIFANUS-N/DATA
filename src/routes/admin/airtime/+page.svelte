<script lang="ts">
  import { airtimeSettings, adminUpdateAirtimeSetting } from '$lib/stores/catalog';
  import { NETWORKS } from '$lib/data/catalog';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira } from '$lib/format';

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
<p class="mb-6 text-sm text-ink/55">Set min/max limits and enable or disable airtime per network.</p>

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
