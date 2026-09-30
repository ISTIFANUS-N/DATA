<script lang="ts">
  import {
    apiProviders, adminAddApiProvider, adminUpdateApiProvider,
    adminDeleteApiProvider, adminSetActiveProvider,
    API_SERVICES, SERVICE_LABELS, type ApiProvider, type ApiServiceType
  } from '$lib/stores/apiProviders';
  import { currentProfile } from '$lib/stores/db';
  import { showToast } from '$lib/stores/toast';

  $: isSuperAdmin = $currentProfile?.role === 'admin' && $currentProfile?.package === 'reseller';

  let showAdd = false;
  let editingId: string | null = null;
  let showKeys: Record<string, boolean> = {};

  const emptyForm = () => ({
    service: 'data' as ApiServiceType,
    name: '',
    baseUrl: '',
    apiKey: '',
    secretKey: '',
    isActive: false,
    environment: 'sandbox' as 'live' | 'sandbox',
    notes: ''
  });
  let form = emptyForm();

  function startAdd() { form = emptyForm(); editingId = null; showAdd = true; }
  function startEdit(p: ApiProvider) {
    form = { service: p.service, name: p.name, baseUrl: p.baseUrl, apiKey: p.apiKey,
      secretKey: p.secretKey, isActive: p.isActive, environment: p.environment, notes: p.notes };
    editingId = p.id; showAdd = false;
  }
  function cancel() { showAdd = false; editingId = null; }

  function save() {
    if (!form.name.trim() || !form.baseUrl.trim()) {
      showToast('Provider name and base URL are required', 'error'); return;
    }
    if (editingId) {
      adminUpdateApiProvider(editingId, form);
      showToast('Provider updated');
    } else {
      adminAddApiProvider(form);
      showToast('Provider added');
    }
    cancel();
  }

  function del(id: string, name: string) {
    if (!confirm(`Delete "${name}" provider?`)) return;
    adminDeleteApiProvider(id);
    showToast('Provider deleted');
  }

  function setActive(service: ApiServiceType, id: string) {
    adminSetActiveProvider(service, id);
    showToast('Active provider updated');
  }

  function mask(key: string) {
    if (!key) return '—';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  }

  $: grouped = API_SERVICES.map(svc => ({
    service: svc,
    label: SERVICE_LABELS[svc],
    providers: $apiProviders.filter(p => p.service === svc)
  }));
</script>

<svelte:head><title>API management — Admin</title></svelte:head>

<div class="mb-6 flex items-center justify-between">
  <div>
    <h1 class="font-display text-xl font-bold text-ink">API management</h1>
    <p class="text-sm text-ink/55">
      {#if isSuperAdmin}Configure VTU provider API keys and endpoints for each service.
      {:else}View-only — super admin access required to edit API credentials.{/if}
    </p>
  </div>
  {#if isSuperAdmin}
    <button type="button" on:click={startAdd}
      class="rounded-lg bg-fanu-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-fanu-700">
      + Add provider
    </button>
  {/if}
</div>

{#if (showAdd || editingId) && isSuperAdmin}
  <div class="mb-6 rounded-2xl bg-white p-5 shadow-sm">
    <p class="mb-4 text-sm font-semibold text-ink">{editingId ? 'Edit provider' : 'Add provider'}</p>
    <div class="grid grid-cols-2 gap-3">
      <label class="flex flex-col gap-1 text-xs">
        <span class="font-medium text-ink/60">Service</span>
        <select bind:value={form.service} class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm">
          {#each API_SERVICES as svc}<option value={svc}>{SERVICE_LABELS[svc]}</option>{/each}
        </select>
      </label>
      <label class="flex flex-col gap-1 text-xs">
        <span class="font-medium text-ink/60">Provider name</span>
        <input type="text" bind:value={form.name} placeholder="e.g. Vtpass, N3T Data"
          class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" />
      </label>
      <label class="col-span-2 flex flex-col gap-1 text-xs">
        <span class="font-medium text-ink/60">Base URL</span>
        <input type="url" bind:value={form.baseUrl} placeholder="https://api.provider.com/v2"
          class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm font-mono" />
      </label>
      <label class="flex flex-col gap-1 text-xs">
        <span class="font-medium text-ink/60">API key</span>
        <input type="password" bind:value={form.apiKey} placeholder="sk_live_..."
          class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm font-mono" />
      </label>
      <label class="flex flex-col gap-1 text-xs">
        <span class="font-medium text-ink/60">Secret key</span>
        <input type="password" bind:value={form.secretKey} placeholder="sk_secret_..."
          class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm font-mono" />
      </label>
      <label class="flex flex-col gap-1 text-xs">
        <span class="font-medium text-ink/60">Environment</span>
        <select bind:value={form.environment} class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm">
          <option value="sandbox">Sandbox / Test</option>
          <option value="live">Live / Production</option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-xs">
        <span class="font-medium text-ink/60">Notes</span>
        <input type="text" bind:value={form.notes} placeholder="e.g. Primary, Failover"
          class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" />
      </label>
    </div>
    <div class="mt-4 flex items-center gap-3">
      <button type="button" on:click={save}
        class="rounded-lg bg-fanu-600 px-4 py-2 text-xs font-semibold text-white hover:bg-fanu-700">Save</button>
      <button type="button" on:click={cancel}
        class="rounded-lg border border-fanu-100 px-4 py-2 text-xs font-semibold text-ink/60 hover:bg-fanu-50">Cancel</button>
      <p class="text-[11px] text-amber-700">
        ⚠ API keys are encrypted at rest. Use Supabase Vault in production for additional security.
      </p>
    </div>
  </div>
{/if}

{#each grouped as group}
  <div class="mb-8">
    <p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">{group.label}</p>
    {#if group.providers.length === 0}
      <div class="rounded-2xl bg-white px-4 py-6 text-center text-xs text-ink/40 shadow-sm">
        No providers configured for {group.label}.
        {#if isSuperAdmin}<button type="button" on:click={startAdd} class="text-fanu-700 hover:underline">Add one</button>{/if}
      </div>
    {:else}
      <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
        {#each group.providers as provider (provider.id)}
          <div class="border-b border-fanu-50 px-4 py-4 last:border-0">
            <div class="mb-2 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <p class="font-semibold text-sm text-ink">{provider.name}</p>
                {#if provider.isActive}
                  <span class="rounded-full bg-fanu-50 px-2 py-0.5 text-[9px] font-bold text-fanu-700">ACTIVE</span>
                {/if}
                <span class="rounded-full px-2 py-0.5 text-[9px] font-bold"
                  class:bg-amber-50={provider.environment === 'sandbox'}
                  class:text-amber-700={provider.environment === 'sandbox'}
                  class:bg-fanu-50={provider.environment === 'live'}
                  class:text-fanu-700={provider.environment === 'live'}
                >
                  {provider.environment.toUpperCase()}
                </span>
              </div>
              <div class="flex gap-2">
                {#if isSuperAdmin && !provider.isActive}
                  <button type="button" on:click={() => setActive(group.service, provider.id)}
                    class="text-[11px] font-medium text-fanu-700 hover:underline">Set active</button>
                {/if}
                {#if isSuperAdmin}
                  <button type="button" on:click={() => startEdit(provider)}
                    class="text-[11px] font-medium text-ink/50 hover:text-ink">Edit</button>
                  <button type="button" on:click={() => del(provider.id, provider.name)}
                    class="text-[11px] font-medium text-red-500 hover:underline">Delete</button>
                {/if}
              </div>
            </div>
            <div class="grid grid-cols-1 gap-1.5 text-[11px]">
              <div class="flex items-center gap-2">
                <span class="text-ink/45 w-16 shrink-0">Base URL</span>
                <span class="font-mono text-ink/70 truncate">{provider.baseUrl}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-ink/45 w-16 shrink-0">API key</span>
                <span class="font-mono text-ink/60">
                  {showKeys[provider.id] ? (provider.apiKey || '—') : mask(provider.apiKey)}
                </span>
                {#if provider.apiKey && isSuperAdmin}
                  <button type="button" on:click={() => (showKeys[provider.id] = !showKeys[provider.id])}
                    class="text-[10px] text-ink/35 hover:text-ink">
                    {showKeys[provider.id] ? 'Hide' : 'Show'}
                  </button>
                {/if}
              </div>
              {#if provider.notes}
                <div class="flex items-center gap-2">
                  <span class="text-ink/45 w-16 shrink-0">Notes</span>
                  <span class="text-ink/60">{provider.notes}</span>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/each}
