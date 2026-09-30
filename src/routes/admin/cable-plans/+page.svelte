<script lang="ts">
  import { cablePlans, adminAddCablePlan, adminUpdateCablePlan, adminDeleteCablePlan } from '$lib/stores/catalog';
  import { stageApproval } from '$lib/stores/approvals';
  import type { CablePlan } from '$lib/data/catalog';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira } from '$lib/format';

  const providers = ['DSTV', 'GOTV', 'STARTIMES'] as const;

  let editingId: string | null = null;
  let showAddForm = false;
  let form = { provider: 'DSTV' as (typeof providers)[number], packageName: '', price: 0 };

  // Fast inline price editing — the most common admin action here
  // ("set and adjust the price of cable sub") doesn't need the full
  // edit form just to change a number.
  let priceDrafts: Record<string, number> = {};

  function startEdit(plan: CablePlan) {
    editingId = plan.id;
    showAddForm = false;
    form = { provider: plan.provider, packageName: plan.packageName, price: plan.price };
  }

  function startAdd() {
    editingId = null;
    showAddForm = true;
    form = { provider: 'DSTV', packageName: '', price: 0 };
  }

  function cancelForm() {
    editingId = null;
    showAddForm = false;
  }

  async function saveForm() {
    if (!form.packageName.trim() || form.price <= 0) {
      showToast('Enter a package name and a price above ₦0', 'error');
      return;
    }
    if (editingId) {
      const staged = await stageApproval('update_cable_plan_price', { id: editingId, ...form });
      if (staged.staged) { showToast('Cable plan change staged for super admin approval'); cancelForm(); return; }
      adminUpdateCablePlan(editingId, { ...form });
      showToast('Cable plan updated');
    } else {
      const staged = await stageApproval('add_cable_plan', { ...form, isActive: true });
      if (staged.staged) { showToast('New cable plan staged for super admin approval'); cancelForm(); return; }
      adminAddCablePlan({ ...form, isActive: true });
      showToast('Cable plan added');
    }
    cancelForm();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm('Request deletion of this plan?')) return;
    const staged = await stageApproval('delete_cable_plan', { id, name });
    if (staged.staged) { showToast('Deletion staged for super admin approval'); return; }
    adminDeleteCablePlan(id);
    showToast('Cable plan deleted');
  }


  async function savePriceDraft(plan: CablePlan) {
    const draft = priceDrafts[plan.id];
    if (draft === undefined || draft === plan.price || draft <= 0) return;
    const staged = await stageApproval('update_cable_plan_price', { id: plan.id, price: draft });
    if (staged.staged) { showToast(`Price change for ${plan.packageName} staged for approval`); return; }
    adminUpdateCablePlan(plan.id, { price: draft });
    showToast(`${plan.packageName} price updated`);
  }

  $: grouped = providers.map((p) => ({
    provider: p,
    plans: $cablePlans.filter((plan) => plan.provider === p)
  }));
</script>

<svelte:head><title>Cable Plans — Admin</title></svelte:head>

<div class="mb-6 flex items-center justify-between">
  <h1 class="font-display text-xl font-bold text-ink">Cable Plans</h1>
  <div class="flex gap-2">
    <button type="button" on:click={startAdd} class="rounded-lg bg-fanu-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-fanu-700">
      + Add package
    </button>
  </div>
</div>

{#if showAddForm || editingId}
  <div class="mb-6 rounded-2xl bg-white p-4 shadow-sm">
    <p class="mb-3 text-sm font-semibold text-ink">{editingId ? 'Edit package' : 'Add package'}</p>
    <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
      <label class="flex flex-col gap-1 text-xs">
        <span class="font-medium text-ink/60">Provider</span>
        <select bind:value={form.provider} class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm">
          {#each providers as p}<option value={p}>{p}</option>{/each}
        </select>
      </label>
      <label class="flex flex-col gap-1 text-xs">
        <span class="font-medium text-ink/60">Package name</span>
        <input type="text" bind:value={form.packageName} placeholder="DStv Compact" class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" />
      </label>
      <label class="flex flex-col gap-1 text-xs">
        <span class="font-medium text-ink/60">Price (₦)</span>
        <input type="number" min="0" bind:value={form.price} class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" />
      </label>
    </div>
    <div class="mt-3 flex gap-2">
      <button type="button" on:click={saveForm} class="rounded-lg bg-fanu-600 px-4 py-2 text-xs font-semibold text-white hover:bg-fanu-700">
        Save
      </button>
      <button type="button" on:click={cancelForm} class="rounded-lg border border-fanu-100 px-4 py-2 text-xs font-semibold text-ink/60 hover:bg-fanu-50">
        Cancel
      </button>
    </div>
  </div>
{/if}

{#each grouped as group}
  {#if group.plans.length > 0}
    <div class="mb-6">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">{group.provider}</p>
      <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
        {#each group.plans as plan (plan.id)}
          <div class="flex items-center justify-between gap-3 border-b border-fanu-50 px-4 py-3 last:border-0">
            <p class="min-w-0 truncate text-sm font-medium text-ink">{plan.packageName}</p>
            <div class="flex shrink-0 items-center gap-2">
              <span class="text-xs text-ink/40">₦</span>
              <input
                type="number"
                min="0"
                value={priceDrafts[plan.id] ?? plan.price}
                on:input={(e) => (priceDrafts[plan.id] = Number(e.currentTarget.value))}
                on:blur={() => savePriceDraft(plan)}
                class="w-24 rounded-lg border border-fanu-100 px-2 py-1.5 text-right font-mono text-sm tabular-nums focus:border-fanu-500"
              />
              <button type="button" on:click={() => startEdit(plan)} class="text-xs font-medium text-ink/50 hover:text-ink">Edit</button>
              <button type="button" on:click={() => handleDelete(plan.id, plan.packageName)} class="text-xs font-medium text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
{/each}
