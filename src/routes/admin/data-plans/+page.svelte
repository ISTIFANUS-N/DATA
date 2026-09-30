<script lang="ts">
  import { dataPlans, adminAddDataPlan, adminUpdateDataPlan, adminDeleteDataPlan } from '$lib/stores/catalog';
  import { stageApproval } from '$lib/stores/approvals';
  import { NETWORKS, DATA_PLAN_TYPES, planSizeLabel, type Network, type DataPlan, type DataPlanType } from '$lib/data/catalog';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira } from '$lib/format';

  let filterNetwork: Network | 'ALL' = 'ALL';
  let filterType: DataPlanType | 'ALL' = 'ALL';
  let editingId: string | null = null;
  let showAddForm = false;

  let form = {
    network: 'MTN' as Network,
    type: 'SME' as DataPlanType,
    apiPlanId: '',
    sizeValue: 1,
    sizeUnit: 'GB' as 'MB' | 'GB',
    validity: '30 days',
    price: 0
  };

  $: filtered = $dataPlans.filter(p =>
    (filterNetwork === 'ALL' || p.network === filterNetwork) &&
    (filterType === 'ALL' || p.type === filterType)
  );

  $: grouped = NETWORKS.map(n => ({
    network: n,
    plans: filtered.filter(p => p.network === n.code)
  })).filter(g => g.plans.length > 0);

  function startEdit(plan: DataPlan) {
    editingId = plan.id; showAddForm = false;
    form = { network: plan.network, type: plan.type, apiPlanId: plan.apiPlanId,
      sizeValue: plan.sizeValue, sizeUnit: plan.sizeUnit, validity: plan.validity, price: plan.price };
  }

  function startAdd() {
    editingId = null; showAddForm = true;
    form = { network: 'MTN', type: 'SME', apiPlanId: '', sizeValue: 1, sizeUnit: 'GB', validity: '30 days', price: 0 };
  }

  function cancelForm() { editingId = null; showAddForm = false; }

  async function saveForm() {
    if (!form.apiPlanId.trim() || form.sizeValue <= 0 || form.price <= 0) {
      showToast('Fill in all fields — API Plan ID, size and price are required', 'error'); return;
    }
    const payload = { ...form, isActive: true };
    if (editingId) {
      const staged = await stageApproval('update_data_plan_price', { id: editingId, ...payload }, `Admin updated plan`);
      if (staged.staged) { showToast('Plan change staged for super admin approval'); cancelForm(); return; }
      adminUpdateDataPlan(editingId, payload);
      showToast('Data plan updated');
    } else {
      const staged = await stageApproval('add_data_plan', payload, `Admin added ${form.sizeValue}${form.sizeUnit} plan`);
      if (staged.staged) { showToast('New plan staged for super admin approval'); cancelForm(); return; }
      adminAddDataPlan(payload);
      showToast('Data plan added');
    }
    cancelForm();
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Request deletion of "${label}"?`)) return;
    const staged = await stageApproval('delete_data_plan', { id, name: label });
    if (staged.staged) { showToast('Deletion staged for super admin approval'); return; }
    adminDeleteDataPlan(id);
    showToast('Data plan deleted');
  }
</script>

<svelte:head><title>Data Plans — Admin</title></svelte:head>

<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
  <h1 class="font-display text-xl font-bold text-ink">Data Plans</h1>
  <button type="button" on:click={startAdd} class="rounded-lg bg-fanu-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-fanu-700">+ Add plan</button>
</div>

<!-- Filters -->
<div class="mb-4 flex flex-wrap gap-2">
  <div class="flex items-center gap-1.5">
    <span class="text-xs text-ink/50">Network:</span>
    <select bind:value={filterNetwork} class="rounded-lg border border-fanu-100 bg-white px-2.5 py-1.5 text-xs">
      <option value="ALL">All</option>
      {#each NETWORKS as n}<option value={n.code}>{n.label}</option>{/each}
    </select>
  </div>
  <div class="flex items-center gap-1.5">
    <span class="text-xs text-ink/50">Type:</span>
    <select bind:value={filterType} class="rounded-lg border border-fanu-100 bg-white px-2.5 py-1.5 text-xs">
      <option value="ALL">All</option>
      {#each DATA_PLAN_TYPES as t}<option value={t.code}>{t.label}</option>{/each}
    </select>
  </div>
</div>

{#if showAddForm || editingId}
  <div class="mb-6 rounded-2xl bg-white p-4 shadow-sm">
    <p class="mb-3 text-sm font-semibold text-ink">{editingId ? 'Edit plan' : 'Add plan'}</p>
    <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
      <label class="flex flex-col gap-1 text-xs"><span class="font-medium text-ink/60">Network</span>
        <select bind:value={form.network} class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm">
          {#each NETWORKS as n}<option value={n.code}>{n.label}</option>{/each}
        </select></label>
      <label class="flex flex-col gap-1 text-xs"><span class="font-medium text-ink/60">Type</span>
        <select bind:value={form.type} class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm">
          {#each DATA_PLAN_TYPES as t}<option value={t.code}>{t.label}</option>{/each}
        </select></label>
      <label class="flex flex-col gap-1 text-xs"><span class="font-medium text-ink/60">API Plan ID</span>
        <input type="text" bind:value={form.apiPlanId} placeholder="e.g. mtn-sme-1gb" class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm font-mono" /></label>
      <label class="flex flex-col gap-1 text-xs"><span class="font-medium text-ink/60">Size (number)</span>
        <input type="number" min="0" step="0.5" bind:value={form.sizeValue} class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" /></label>
      <label class="flex flex-col gap-1 text-xs"><span class="font-medium text-ink/60">Unit</span>
        <select bind:value={form.sizeUnit} class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm">
          <option value="MB">MB</option>
          <option value="GB">GB</option>
        </select></label>
      <label class="flex flex-col gap-1 text-xs"><span class="font-medium text-ink/60">Validity</span>
        <input type="text" bind:value={form.validity} placeholder="30 days" class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" /></label>
      <label class="flex flex-col gap-1 text-xs"><span class="font-medium text-ink/60">Price (₦)</span>
        <input type="number" min="0" bind:value={form.price} class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" /></label>
    </div>
    <p class="mt-2 text-[11px] text-ink/40">Display: <strong>{form.sizeValue}{form.sizeUnit}</strong> · {form.validity} · {formatNaira(form.price)}</p>
    <div class="mt-3 flex gap-2">
      <button type="button" on:click={saveForm} class="rounded-lg bg-fanu-600 px-4 py-2 text-xs font-semibold text-white hover:bg-fanu-700">Save</button>
      <button type="button" on:click={cancelForm} class="rounded-lg border border-fanu-100 px-4 py-2 text-xs font-semibold text-ink/60 hover:bg-fanu-50">Cancel</button>
    </div>
  </div>
{/if}

{#each grouped as group}
  <div class="mb-6">
    <div class="mb-2 flex items-center gap-2">
      <div class="h-6 w-6 overflow-hidden rounded-md">
        {@html group.network.logo}
      </div>
      <p class="text-xs font-bold uppercase tracking-wide text-ink/50">{group.network.label}</p>
      <span class="text-[10px] text-ink/30">{group.plans.length} plans</span>
    </div>
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
      {#each group.plans as plan (plan.id)}
        <div class="flex items-center gap-3 border-b border-fanu-50 px-4 py-3 last:border-0"
          style={!plan.isActive ? 'opacity:0.5' : ''}>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="font-mono text-sm font-bold text-ink">{planSizeLabel(plan)}</p>
              <span class="rounded-full bg-fanu-50 px-1.5 py-0.5 text-[9px] font-semibold text-fanu-700">
                {DATA_PLAN_TYPES.find(t => t.code === plan.type)?.label}
              </span>
              {#if !plan.isActive}
                <span class="rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold text-red-600">Off</span>
              {/if}
            </div>
            <p class="text-[10px] text-ink/40">{plan.validity} · API: <span class="font-mono">{plan.apiPlanId}</span></p>
          </div>
          <p class="font-mono text-sm font-semibold tabular-nums text-fanu-700">{formatNaira(plan.price)}</p>
          <button type="button" on:click={() => startEdit(plan)} class="text-xs font-medium text-ink/50 hover:text-ink">Edit</button>
          <button type="button" on:click={() => handleDelete(plan.id, planSizeLabel(plan))} class="text-xs font-medium text-red-500 hover:underline">Del</button>
        </div>
      {/each}
    </div>
  </div>
{/each}
