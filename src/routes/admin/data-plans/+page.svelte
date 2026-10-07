<script lang="ts">
  import { dataPlans, adminAddDataPlan, adminUpdateDataPlan, adminDeleteDataPlan } from '$lib/stores/catalog';
  import { dataPlanTypes, planTypes, settingsLoaded, saveSetting, makePlanTypeCode, planTypeLabel, type PlanTypeDef } from '$lib/stores/settings';
  import { stageApproval } from '$lib/stores/approvals';
  import { NETWORKS, planSizeLabel, type Network, type DataPlan, type DataPlanType } from '$lib/data/catalog';
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

  // ── Plan types customers can see ──
  async function setTypeEnabled(type: DataPlanType, on: boolean) {
    const res = await saveSetting('data_plan_types', { ...$dataPlanTypes, [type]: on });
    showToast(res.ok ? `${planTypeLabel($planTypes, type)} ${on ? 'shown to' : 'hidden from'} customers` : res.error, res.ok ? undefined : 'error');
  }

  // ── Add / rename / remove plan types ──
  let typeEdits: PlanTypeDef[] = [];
  let typeEditsReady = false;
  $: if ($settingsLoaded && !typeEditsReady) { typeEdits = $planTypes.map(t => ({ ...t })); typeEditsReady = true; }
  let newTypeName = '';
  let savingTypes = false;
  const plansUsing = (code: string) => $dataPlans.filter(p => p.type === code).length;

  async function persistTypes(next: PlanTypeDef[], okMessage: string): Promise<boolean> {
    savingTypes = true;
    const res = await saveSetting('data_plan_type_defs', next);
    savingTypes = false;
    if (!res.ok) { showToast(res.error, 'error'); return false; }
    typeEdits = $planTypes.map(t => ({ ...t }));
    showToast(okMessage);
    return true;
  }

  function labelTaken(label: string, exceptCode?: string) {
    return typeEdits.some(t => t.code !== exceptCode && t.label.trim().toLowerCase() === label.trim().toLowerCase());
  }

  async function saveTypeNames() {
    if (typeEdits.some(t => !t.label.trim())) { showToast('Every plan type needs a name', 'error'); return; }
    const seen = new Set<string>();
    for (const t of typeEdits) {
      const k = t.label.trim().toLowerCase();
      if (seen.has(k)) { showToast(`Two types are both called "${t.label.trim()}"`, 'error'); return; }
      seen.add(k);
    }
    await persistTypes(typeEdits.map(t => ({ code: t.code, label: t.label.trim(), blurb: (t.blurb ?? '').trim() })), 'Plan types saved');
  }

  async function addType() {
    const name = newTypeName.trim();
    if (!name) { showToast('Type a name for the new plan type', 'error'); return; }
    if (labelTaken(name)) { showToast(`"${name}" already exists`, 'error'); return; }
    const code = makePlanTypeCode(name, typeEdits.map(t => t.code));
    if (await persistTypes([...typeEdits, { code, label: name, blurb: '' }], `"${name}" added`)) newTypeName = '';
  }

  async function deleteType(code: string) {
    const def = typeEdits.find(t => t.code === code);
    if (plansUsing(code) > 0) { showToast('Move or delete the plans using this type first', 'error'); return; }
    if (!confirm(`Delete the plan type "${def?.label}"?`)) return;
    await persistTypes(typeEdits.filter(t => t.code !== code), 'Plan type deleted');
  }

  function startEdit(plan: DataPlan) {
    editingId = plan.id; showAddForm = false;
    form = { network: plan.network, type: plan.type, apiPlanId: plan.apiPlanId,
      sizeValue: plan.sizeValue, sizeUnit: plan.sizeUnit, validity: plan.validity, price: plan.price };
  }

  // Start a new plan from an existing one (same network, type, size, validity): just enter the new plan number and price.
  function duplicatePlan(plan: DataPlan) {
    editingId = null; showAddForm = true;
    form = { network: plan.network, type: plan.type, apiPlanId: '', sizeValue: plan.sizeValue,
      sizeUnit: plan.sizeUnit, validity: plan.validity, price: plan.price };
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startAdd() {
    editingId = null; showAddForm = true;
    form = { network: 'MTN', type: 'SME', apiPlanId: '', sizeValue: 1, sizeUnit: 'GB', validity: '30 days', price: 0 };
  }

  function cancelForm() { editingId = null; showAddForm = false; }

  async function saveForm() {
    form.apiPlanId = form.apiPlanId.trim();
    if (!/^\d+$/.test(form.apiPlanId)) {
      showToast('API Plan ID must be a number — the plan number from your provider (e.g. 12)', 'error'); return;
    }
    if (form.sizeValue <= 0 || form.price <= 0) {
      showToast('Fill in all fields — size and price are required', 'error'); return;
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
      {#each $planTypes as t}<option value={t.code}>{t.label}</option>{/each}
    </select>
  </div>
</div>

<!-- Plan types: add, rename, show/hide -->
<div class="mb-4 rounded-2xl bg-white p-4 shadow-sm">
  <p class="text-sm font-semibold text-ink">Plan types</p>
  <p class="mb-3 text-[11px] text-ink/50">
    Rename types, add new ones, or switch a type off for customers. Types with no active plans on a network are hidden automatically.
  </p>

  <div class="space-y-2">
    {#each typeEdits as t (t.code)}
      {@const on = $dataPlanTypes[t.code] !== false}
      <div class="rounded-xl border border-fanu-100 p-2.5">
        <div class="flex items-center gap-2">
          <input type="text" bind:value={t.label} maxlength="40" aria-label="Type name"
            class="min-w-0 flex-1 rounded-lg border border-fanu-100 px-2.5 py-1.5 text-sm font-semibold" />
          <label class="flex shrink-0 cursor-pointer items-center gap-1.5 text-[11px] text-ink/60">
            Shown
            <input type="checkbox" checked={on} on:change={(e) => setTypeEnabled(t.code, e.currentTarget.checked)} class="h-4 w-4 accent-fanu-600" />
          </label>
          <button type="button" on:click={() => deleteType(t.code)} disabled={savingTypes}
            class="shrink-0 text-xs font-medium text-red-500 hover:underline disabled:opacity-40"
            title={plansUsing(t.code) ? 'In use by plans' : 'Delete type'}>Delete</button>
        </div>
        <input type="text" bind:value={t.blurb} maxlength="120" placeholder="Short description customers see (optional)"
          class="mt-1.5 w-full rounded-lg border border-fanu-100 px-2.5 py-1.5 text-[11px]" />
        <p class="mt-1 text-[10px] text-ink/40">{plansUsing(t.code)} plan{plansUsing(t.code) === 1 ? '' : 's'} · code <span class="font-mono">{t.code}</span></p>
      </div>
    {/each}
  </div>

  <div class="mt-3 flex flex-wrap items-center gap-2">
    <button type="button" on:click={saveTypeNames} disabled={savingTypes}
      class="rounded-lg bg-fanu-600 px-4 py-2 text-xs font-semibold text-white hover:bg-fanu-700 disabled:opacity-60">
      {savingTypes ? 'Saving…' : 'Save type names'}
    </button>
    <span class="text-[11px] text-ink/40">or add a new one:</span>
    <input type="text" bind:value={newTypeName} maxlength="40" placeholder="e.g. Direct Data"
      on:keydown={(e) => e.key === 'Enter' && addType()}
      class="min-w-0 flex-1 rounded-lg border border-fanu-100 px-2.5 py-2 text-sm sm:max-w-[200px]" />
    <button type="button" on:click={addType} disabled={savingTypes}
      class="rounded-lg border border-fanu-100 px-3.5 py-2 text-xs font-semibold text-ink/70 hover:bg-fanu-50 disabled:opacity-60">+ Add type</button>
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
          {#each $planTypes as t}<option value={t.code}>{t.label}</option>{/each}
        </select></label>
      <label class="flex flex-col gap-1 text-xs"><span class="font-medium text-ink/60">API Plan ID (number)</span>
        <input type="text" inputmode="numeric" pattern="[0-9]*" bind:value={form.apiPlanId}
          on:input={() => (form.apiPlanId = form.apiPlanId.replace(/\D/g, ''))}
          placeholder="e.g. 12" class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm font-mono" />
        <span class="text-[10px] text-ink/40">The plan number from your provider's dashboard (for example 12).</span>
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
                {planTypeLabel($planTypes, plan.type)}
              </span>
              {#if !plan.isActive}
                <span class="rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold text-red-600">Off</span>
              {/if}
            </div>
            <p class="text-[10px] text-ink/40">{plan.validity} · API: <span class="font-mono">{plan.apiPlanId}</span></p>
          </div>
          <p class="font-mono text-sm font-semibold tabular-nums text-fanu-700">{formatNaira(plan.price)}</p>
          <button type="button" on:click={() => startEdit(plan)} class="text-xs font-medium text-ink/50 hover:text-ink">Edit</button>
          <button type="button" on:click={() => duplicatePlan(plan)} class="text-xs font-medium text-ink/50 hover:text-ink" title="Start a new plan from this one">Copy</button>
          <button type="button" on:click={() => handleDelete(plan.id, planSizeLabel(plan))} class="text-xs font-medium text-red-500 hover:underline">Del</button>
        </div>
      {/each}
    </div>
  </div>
{/each}
