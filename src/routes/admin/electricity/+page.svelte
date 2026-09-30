<script lang="ts">
  import { discoSettings, adminUpdateDisco } from '$lib/stores/catalog';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira } from '$lib/format';

  let drafts: Record<string, { label: string; minAmount: number }> = {};

  function save(code: string) {
    const d = drafts[code];
    if (!d) return;
    adminUpdateDisco(code, d);
    showToast(`${code} settings saved`);
    delete drafts[code];
  }

  function toggleActive(code: string, val: boolean) {
    adminUpdateDisco(code, { isActive: val });
    showToast(`${code} ${val ? 'enabled' : 'disabled'}`);
  }
</script>

<svelte:head><title>Electricity settings — Admin</title></svelte:head>

<h1 class="mb-2 font-display text-xl font-bold text-ink">Electricity (DisCos)</h1>
<p class="mb-6 text-sm text-ink/55">Manage electricity providers, display names and minimum purchase amounts.</p>

<div class="overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each $discoSettings as disco (disco.code)}
    <div class="border-b border-fanu-50 px-4 py-4 last:border-0">
      <div class="mb-3 flex items-center justify-between">
        <p class="font-semibold text-ink">{disco.code}</p>
        <label class="flex cursor-pointer items-center gap-2">
          <span class="text-xs text-ink/50">{disco.isActive ? 'Active' : 'Disabled'}</span>
          <input type="checkbox" checked={disco.isActive} on:change={(e) => toggleActive(disco.code, e.currentTarget.checked)} class="h-4 w-4 accent-fanu-600" />
        </label>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <label class="flex flex-col gap-1 text-xs">
          <span class="font-medium text-ink/60">Display label</span>
          <input type="text" value={drafts[disco.code]?.label ?? disco.label}
            on:input={(e) => (drafts[disco.code] = { ...(drafts[disco.code] ?? { label: disco.label, minAmount: disco.minAmount }), label: e.currentTarget.value })}
            class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" />
        </label>
        <label class="flex flex-col gap-1 text-xs">
          <span class="font-medium text-ink/60">Min purchase (₦)</span>
          <input type="number" min="0" value={drafts[disco.code]?.minAmount ?? disco.minAmount}
            on:input={(e) => (drafts[disco.code] = { ...(drafts[disco.code] ?? { label: disco.label, minAmount: disco.minAmount }), minAmount: +e.currentTarget.value })}
            class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" />
        </label>
      </div>
      {#if drafts[disco.code]}
        <button type="button" on:click={() => save(disco.code)} class="mt-2 rounded-lg bg-fanu-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-fanu-700">Save</button>
      {/if}
    </div>
  {/each}
</div>
