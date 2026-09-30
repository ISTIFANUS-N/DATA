<script lang="ts">
  import { onMount } from 'svelte';
  import { allAccountsForAdmin, loadAllAccountsForAdmin, assignAdmin, revokeAdmin, currentProfile } from '$lib/stores/db';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira } from '$lib/format';

  $: isSuperAdmin = $currentProfile?.role === 'admin' && $currentProfile?.package === 'reseller';

  let search = '';
  let loading: Record<string, boolean> = {};

  onMount(() => loadAllAccountsForAdmin());

  $: filtered = $allAccountsForAdmin.filter(a =>
    !search ||
    a.profile.fullName.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  $: admins    = filtered.filter(a => a.profile.role === 'admin');
  $: customers = filtered.filter(a => a.profile.role !== 'admin');

  async function handleAssign(userId: string, name: string) {
    if (!confirm(`Assign admin role to ${name}? They will have access to the admin dashboard.`)) return;
    loading[userId] = true;
    const result = await assignAdmin(userId);
    loading[userId] = false;
    if (!result.ok) { showToast(result.error, 'error'); return; }
    showToast(`${name} is now an admin`);
  }

  async function handleRevoke(userId: string, name: string) {
    if (!confirm(`Remove admin role from ${name}? They will lose dashboard access immediately.`)) return;
    loading[userId] = true;
    const result = await revokeAdmin(userId);
    loading[userId] = false;
    if (!result.ok) { showToast(result.error, 'error'); return; }
    showToast(`${name} is no longer an admin`);
  }
</script>

<svelte:head><title>User roles — Admin</title></svelte:head>

<div class="mb-6">
  <h1 class="font-display text-xl font-bold text-ink">User roles</h1>
  <p class="mt-1 text-sm text-ink/55">
    {#if isSuperAdmin}
      Assign or revoke admin access for registered users.
    {:else}
      View-only — only super admins can change roles.
    {/if}
  </p>
</div>

{#if !isSuperAdmin}
  <div class="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-4 mb-6">
    <p class="text-sm font-semibold text-amber-800">Super admin access required</p>
    <p class="text-sm text-amber-700 mt-1">Only super admins can assign or revoke admin roles. Contact your super admin to make changes.</p>
  </div>
{/if}

<!-- Search -->
<div class="mb-6">
  <input type="search" bind:value={search} placeholder="Search by name or email…"
    class="w-full rounded-xl border border-fanu-100 bg-white px-3.5 py-3 text-sm focus:border-fanu-500 focus:outline-none shadow-sm" />
</div>

<!-- Current admins -->
<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">
  Admins ({admins.length})
</p>
<div class="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
  {#if admins.length === 0}
    <p class="px-5 py-6 text-sm text-ink/40">No admins found.</p>
  {:else}
    {#each admins as a (a.email)}
      <div class="flex items-center gap-3 border-b border-fanu-50 px-4 py-3.5 last:border-0">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fanu-100 font-display text-sm font-bold text-fanu-700">
          {a.profile.fullName?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <p class="truncate text-sm font-semibold text-ink">{a.profile.fullName || '—'}</p>
            {#if a.profile.package === 'reseller'}
              <span class="rounded-full bg-fanu-600 px-2 py-0.5 text-[9px] font-bold text-white">SUPER</span>
            {:else}
              <span class="rounded-full bg-fanu-50 px-2 py-0.5 text-[9px] font-bold text-fanu-700">ADMIN</span>
            {/if}
          </div>
          <p class="truncate text-[11px] text-ink/45">{a.email} · {a.profile.phone || 'No phone'}</p>
        </div>
        {#if isSuperAdmin && a.profile.package !== 'reseller'}
          <button type="button"
            on:click={() => handleRevoke(a.profile.id, a.profile.fullName || a.email)}
            disabled={loading[a.profile.id]}
            class="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50">
            {loading[a.profile.id] ? 'Removing…' : 'Remove admin'}
          </button>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<!-- Regular users -->
<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">
  Users ({customers.length})
</p>
<div class="overflow-hidden rounded-2xl bg-white shadow-sm">
  {#if customers.length === 0}
    <p class="px-5 py-6 text-sm text-ink/40">No users found.</p>
  {:else}
    {#each customers as a (a.email)}
      <div class="flex items-center gap-3 border-b border-fanu-50 px-4 py-3.5 last:border-0">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/10 font-display text-sm font-bold text-ink/50">
          {a.profile.fullName?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-ink">{a.profile.fullName || '—'}</p>
          <p class="truncate text-[11px] text-ink/45">{a.email} · {a.profile.phone || 'No phone'}</p>
        </div>
        {#if isSuperAdmin}
          <button type="button"
            on:click={() => handleAssign(a.profile.id, a.profile.fullName || a.email)}
            disabled={loading[a.profile.id]}
            class="shrink-0 rounded-lg bg-fanu-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-fanu-700 disabled:opacity-50">
            {loading[a.profile.id] ? 'Assigning…' : 'Make admin'}
          </button>
        {/if}
      </div>
    {/each}
  {/if}
</div>
