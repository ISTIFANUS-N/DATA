<script lang="ts">
  import { smsPackages, adminUpdateSmsPackage, adminAddSmsPackage, adminDeleteSmsPackage } from '$lib/stores/catalog';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira } from '$lib/format';
  import type { BulkSmsPackage } from '$lib/data/catalog';

  let editingId: string | null = null;
  let showAdd = false;
  let form = { units: 0, price: 0 };

  function startEdit(p: BulkSmsPackage) { editingId = p.id; form = { units: p.units, price: p.price }; showAdd = false; }
  function cancelForm() { editingId = null; showAdd = false; }

  function save() {
    if (form.units <= 0 || form.price <= 0) return showToast('Enter units and price above 0', 'error');
    if (editingId) {
      adminUpdateSmsPackage(editingId, form);
      showToast('Package updated');
    } else {
      adminAddSmsPackage({ ...form, isActive: true });
      showToast('Package added');
    }
    cancelForm();
  }

  function del(id: string) {
    if (!confirm('Delete this package?')) return;
    adminDeleteSmsPackage(id);
    showToast('Package deleted');
  }
</script>

<svelte:head><title>Bulk SMS packages — Admin</title></svelte:head>

<div class="mb-6 flex items-center justify-between">
  <div>
    <h1 class="font-display text-xl font-bold text-ink">Bulk SMS packages</h1>
    <p class="text-sm text-ink/55">Set the unit bundles and pricing customers can purchase.</p>
  </div>
  <button type="button" on:click={() => { showAdd = true; editingId = null; form = { units: 0, price: 0 }; }} class="rounded-lg bg-fanu-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-fanu-700">+ Add package</button>
</div>

{#if showAdd || editingId}
  <div class="mb-6 rounded-2xl bg-white p-4 shadow-sm">
    <p class="mb-3 text-sm font-semibold text-ink">{editingId ? 'Edit package' : 'Add package'}</p>
    <div class="grid grid-cols-2 gap-3">
      <label class="flex flex-col gap-1 text-xs"><span class="font-medium text-ink/60">Units</span>
        <input type="number" min="1" bind:value={form.units} class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" /></label>
      <label class="flex flex-col gap-1 text-xs"><span class="font-medium text-ink/60">Price (₦)</span>
        <input type="number" min="1" bind:value={form.price} class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" /></label>
    </div>
    <div class="mt-3 flex gap-2">
      <button type="button" on:click={save} class="rounded-lg bg-fanu-600 px-4 py-2 text-xs font-semibold text-white hover:bg-fanu-700">Save</button>
      <button type="button" on:click={cancelForm} class="rounded-lg border border-fanu-100 px-4 py-2 text-xs font-semibold text-ink/60 hover:bg-fanu-50">Cancel</button>
    </div>
  </div>
{/if}

<div class="overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each $smsPackages as pkg (pkg.id)}
    <div class="flex items-center justify-between border-b border-fanu-50 px-4 py-3 last:border-0">
      <div>
        <p class="text-sm font-semibold text-ink">{pkg.units.toLocaleString()} units</p>
        <p class="text-xs text-ink/45">₦{(pkg.price / pkg.units * 1000).toFixed(1)} per 1,000 SMS</p>
      </div>
      <div class="flex items-center gap-4">
        <p class="font-mono text-sm font-semibold tabular-nums text-fanu-700">{formatNaira(pkg.price)}</p>
        <button type="button" on:click={() => startEdit(pkg)} class="text-xs font-medium text-ink/50 hover:text-ink">Edit</button>
        <button type="button" on:click={() => del(pkg.id)} class="text-xs font-medium text-red-500 hover:underline">Delete</button>
      </div>
    </div>
  {/each}
</div>
