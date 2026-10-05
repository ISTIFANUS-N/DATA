<script lang="ts">
  import { dataPlans, adminAddDataPlan, adminAddDataPlans, adminUpdateDataPlan, adminDeleteDataPlan } from '$lib/stores/catalog';
  import { currentProfile } from '$lib/stores/db';
  import { dataPlanTypes, saveSetting } from '$lib/stores/settings';
  import { stageApproval } from '$lib/stores/approvals';
  import { NETWORKS, DATA_PLAN_TYPES, planSizeLabel, type Network, type DataPlan, type DataPlanType } from '$lib/data/catalog';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira } from '$lib/format';

  let filterNetwork: Network | 'ALL' = 'ALL';
  let filterType: DataPlanType | 'ALL' = 'ALL';
  let editingId: string | null = null;
  let showAddForm = false;

  // Real plan codes from the provider (VTpass), so the API Plan ID is never guessed.
  type ProviderPlan = { code: string; name: string; amount: number; size?: number; unit?: 'MB' | 'GB'; validity?: string; type?: string };
  let providerPlans: ProviderPlan[] = [];
  let loadingPlans = false;
  async function loadProviderPlans() {
    loadingPlans = true; providerPlans = [];
    try {
      const res = await fetch(`/api/admin/provider-plans?network=${form.network}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) { showToast(data?.error ?? 'Could not load provider plans', 'error'); return; }
      providerPlans = data.plans;
      if (!providerPlans.length) showToast('The provider returned no plans for this network', 'error');
    } catch { showToast('Network problem loading provider plans', 'error'); }
    finally { loadingPlans = false; }
  }

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

  // ── Plan types customers can see ──
  $: isSuperAdmin = $currentProfile?.role === 'admin' && $currentProfile?.package === 'reseller';
  async function setTypeEnabled(type: DataPlanType, on: boolean) {
    const res = await saveSetting('data_plan_types', { ...$dataPlanTypes, [type]: on });
    showToast(res.ok ? `${DATA_PLAN_TYPES.find(t => t.code === type)?.label} ${on ? 'shown to' : 'hidden from'} customers` : res.error, res.ok ? undefined : 'error');
  }

  // ── Import plans from the provider ──
  let importNetwork: Network = 'MTN';
  let importMarkup = 0;
  let importPlans: ProviderPlan[] = [];
  let importSelected: Record<string, boolean> = {};
  let importLoading = false;
  let importing = false;

  function mapType(t?: string): DataPlanType {
    const s = (t ?? '').toLowerCase();
    if (s.includes('corporate')) return 'CORPORATE_GIFTING';
    if (s.includes('share')) return 'DATA_SHARE';
    if (s.includes('gift')) return 'GIFTING';
    if (s.includes('sme')) return 'SME';
    return 'GIFTING';
  }

  $: existingCodes = new Set($dataPlans.filter(p => p.network === importNetwork).map(p => p.apiPlanId));
  $: importable = importPlans.filter(p => p.size && p.unit);
  $: selectedCount = importable.filter(p => importSelected[p.code]).length;

  async function loadImportPlans() {
    importLoading = true; importPlans = []; importSelected = {};
    try {
      const res = await fetch(`/api/admin/provider-plans?network=${importNetwork}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) { showToast(data?.error ?? 'Could not load provider plans', 'error'); return; }
      importPlans = data.plans;
      // Pre-tick plans that are not in your list yet.
      importSelected = Object.fromEntries(importPlans.filter(p => !existingCodes.has(p.code)).map(p => [p.code, true]));
      if (!importPlans.length) showToast('The provider returned no plans for this network', 'error');
    } catch { showToast('Network problem loading provider plans', 'error'); }
    finally { importLoading = false; }
  }

  async function importSelectedPlans() {
    const picked = importable.filter(p => importSelected[p.code]);
    if (!picked.length) return;
    importing = true;
    const res = await adminAddDataPlans(picked.map(p => ({
      network: importNetwork,
      type: mapType(p.type),
      apiPlanId: p.code,
      sizeValue: p.size!,
      sizeUnit: p.unit!,
      validity: p.validity ?? '30 days',
      price: Math.round(p.amount + (Number(importMarkup) || 0)),
      isActive: true
    })));
    importing = false;
    if (!res.ok) { showToast(res.error, 'error'); return; }
    showToast(`${picked.length} plan${picked.length === 1 ? '' : 's'} added`);
    importPlans = []; importSelected = {};
  }

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
      const r = await adminUpdateDataPlan(editingId, payload);
      if (!r.ok) { showToast(r.error, 'error'); return; }
      showToast('Data plan updated');
    } else {
      const staged = await stageApproval('add_data_plan', payload, `Admin added ${form.sizeValue}${form.sizeUnit} plan`);
      if (staged.staged) { showToast('New plan staged for super admin approval'); cancelForm(); return; }
      const r = await adminAddDataPlan(payload);
      if (!r.ok) { showToast(r.error, 'error'); return; }
      showToast('Data plan added');
    }
    cancelForm();
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Request deletion of "${label}"?`)) return;
    const staged = await stageApproval('delete_data_plan', { id, name: label });
    if (staged.staged) { showToast('Deletion staged for super admin approval'); return; }
    const r = await adminDeleteDataPlan(id);
    if (!r.ok) { showToast(r.error, 'error'); return; }
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

<!-- Plan types customers can see -->
<div class="mb-4 rounded-2xl bg-white p-4 shadow-sm">
  <p class="text-sm font-semibold text-ink">Plan types shown to customers</p>
  <p class="mb-3 text-[11px] text-ink/50">
    Switch off a type your provider doesn't offer. Types with no active plans on a network are hidden automatically.
  </p>
  <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
    {#each DATA_PLAN_TYPES as t}
      {@const on = $dataPlanTypes[t.code] !== false}
      <label class="flex cursor-pointer items-center justify-between rounded-xl border border-fanu-100 px-3 py-2.5">
        <span class="min-w-0 pr-3">
          <span class="block text-xs font-semibold text-ink">{t.label}</span>
          <span class="block truncate text-[10px] text-ink/45">{$dataPlans.filter(p => p.type === t.code).length} plans</span>
        </span>
        <input type="checkbox" checked={on} on:change={(e) => setTypeEnabled(t.code, e.currentTarget.checked)} class="h-4 w-4 accent-fanu-600" />
      </label>
    {/each}
  </div>
</div>

<!-- Import plans from the provider -->
<div class="mb-4 rounded-2xl bg-white p-4 shadow-sm">
  <p class="text-sm font-semibold text-ink">Import plans from provider</p>
  {#if !isSuperAdmin}
    <p class="mt-1 text-[11px] text-ink/50">Only a super admin can bulk-import plans. You can still add plans one at a time with "+ Add plan".</p>
  {:else}
    <p class="mb-3 text-[11px] text-ink/50">
      Load your provider's plans, tick the ones to sell, and add your markup. The price you set = provider price + markup.
    </p>
    <div class="flex flex-wrap items-end gap-3">
      <label class="flex flex-col gap-1 text-xs"><span class="font-medium text-ink/60">Network</span>
        <select bind:value={importNetwork} on:change={() => { importPlans = []; importSelected = {}; }} class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm">
          {#each NETWORKS as n}<option value={n.code}>{n.label}</option>{/each}
        </select></label>
      <label class="flex flex-col gap-1 text-xs"><span class="font-medium text-ink/60">Markup per plan (₦)</span>
        <input type="number" min="0" bind:value={importMarkup} class="w-28 rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" /></label>
      <button type="button" on:click={loadImportPlans} disabled={importLoading}
        class="rounded-lg bg-fanu-600 px-4 py-2 text-xs font-semibold text-white hover:bg-fanu-700 disabled:opacity-60">
        {importLoading ? 'Loading…' : 'Load plans'}
      </button>
    </div>

    {#if importPlans.length && !importable.length}
      <p class="mt-3 text-[11px] text-amber-700">
        This provider doesn't send plan sizes, so plans can't be imported automatically. Use "Pick from provider" when adding a plan instead.
      </p>
    {:else if importable.length}
      <div class="mt-3 max-h-72 overflow-y-auto rounded-xl border border-fanu-100">
        {#each importable as p (p.code)}
          <label class="flex cursor-pointer items-center gap-3 border-b border-fanu-50 px-3 py-2 last:border-0">
            <input type="checkbox" bind:checked={importSelected[p.code]} class="h-4 w-4 accent-fanu-600" />
            <span class="min-w-0 flex-1 text-xs text-ink">{p.name}
              {#if existingCodes.has(p.code)}<span class="ml-1 rounded-full bg-fanu-50 px-1.5 py-0.5 text-[9px] font-semibold text-fanu-700">already added</span>{/if}
            </span>
            <span class="shrink-0 text-right font-mono text-[11px] text-ink/60">
              cost {formatNaira(p.amount)} → <strong class="text-fanu-700">{formatNaira(Math.round(p.amount + (Number(importMarkup) || 0)))}</strong>
            </span>
          </label>
        {/each}
      </div>
      <button type="button" on:click={importSelectedPlans} disabled={importing || !selectedCount}
        class="mt-3 rounded-lg bg-fanu-600 px-4 py-2 text-xs font-semibold text-white hover:bg-fanu-700 disabled:opacity-60">
        {importing ? 'Adding…' : `Add ${selectedCount} selected plan${selectedCount === 1 ? '' : 's'}`}
      </button>
    {/if}
  {/if}
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
        <input type="text" bind:value={form.apiPlanId} placeholder="e.g. mtn-sme-1gb" class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm font-mono" />
        <button type="button" on:click={loadProviderPlans} disabled={loadingPlans}
          class="mt-1 self-start text-[11px] font-semibold text-fanu-700 hover:underline disabled:opacity-50">
          {loadingPlans ? 'Loading…' : `Pick from provider (${form.network})`}
        </button>
      </label>
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
    {#if providerPlans.length}
      <label class="mt-3 flex flex-col gap-1 text-xs">
        <span class="font-medium text-ink/60">Provider plans — choose one to fill the plan code</span>
        <select class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm"
          on:change={(e) => { form.apiPlanId = e.currentTarget.value; }}>
          <option value="">Select a plan…</option>
          {#each providerPlans as p}
            <option value={p.code}>{p.name} — {formatNaira(p.amount)} ({p.code})</option>
          {/each}
        </select>
        <span class="text-[10px] text-ink/40">The amount shown is what the provider charges you. Set your own selling price below.</span>
      </label>
    {/if}
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
