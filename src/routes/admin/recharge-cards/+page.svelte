<script lang="ts">
  import { rechargeDenominations, adminUpdateRechargeDenom, adminAddRechargeDenom, adminDeleteRechargeDenom } from '$lib/stores/catalog';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira } from '$lib/format';

  let newValue: number | null = null;

  function add() {
    if (!newValue || newValue <= 0) return showToast('Enter a denomination above ₦0', 'error');
    adminAddRechargeDenom(newValue);
    showToast(`₦${newValue} denomination added`);
    newValue = null;
  }

  function toggle(value: number, val: boolean) {
    adminUpdateRechargeDenom(value, val);
    showToast(`₦${value.toLocaleString()} ${val ? 'enabled' : 'disabled'}`);
  }

  function del(value: number) {
    if (!confirm(`Remove ₦${value.toLocaleString()} denomination?`)) return;
    adminDeleteRechargeDenom(value);
    showToast('Denomination removed');
  }
</script>

<svelte:head><title>Recharge card settings — Admin</title></svelte:head>

<h1 class="mb-2 font-display text-xl font-bold text-ink">Recharge card printing</h1>
<p class="mb-6 text-sm text-ink/55">Manage available card denominations customers can print.</p>

<div class="mb-4 flex gap-2">
  <input type="number" min="1" bind:value={newValue} placeholder="New denomination (₦)" class="rounded-xl border border-fanu-100 bg-white px-3.5 py-2.5 text-sm focus:border-fanu-500" style="min-width:200px" />
  <button type="button" on:click={add} class="rounded-xl bg-fanu-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-fanu-700">Add</button>
</div>

<div class="overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each $rechargeDenominations as denom (denom.value)}
    <div class="flex items-center justify-between border-b border-fanu-50 px-4 py-3 last:border-0">
      <div class="flex items-center gap-3">
        <span class="font-mono text-sm font-semibold tabular-nums text-ink">{formatNaira(denom.value)}</span>
        {#if !denom.isActive}
          <span class="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">Disabled</span>
        {/if}
      </div>
      <div class="flex items-center gap-3">
        <label class="flex cursor-pointer items-center gap-1.5 text-xs text-ink/50">
          <input type="checkbox" checked={denom.isActive} on:change={(e) => toggle(denom.value, e.currentTarget.checked)} class="h-4 w-4 accent-fanu-600" />
          {denom.isActive ? 'Active' : 'Inactive'}
        </label>
        <button type="button" on:click={() => del(denom.value)} class="text-xs font-medium text-red-500 hover:underline">Remove</button>
      </div>
    </div>
  {/each}
</div>
