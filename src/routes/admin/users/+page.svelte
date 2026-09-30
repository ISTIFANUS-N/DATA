<script lang="ts">
  import { allAccountsForAdmin, currentProfile } from '$lib/stores/db';
  import AdminUserRow from '$lib/components/AdminUserRow.svelte';

  let search = '';

  $: filtered = $allAccountsForAdmin.filter((row) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      row.email.toLowerCase().includes(q) ||
      row.profile.fullName.toLowerCase().includes(q) ||
      row.profile.phone.includes(q)
    );
  });
</script>

<svelte:head><title>Users — Admin</title></svelte:head>

<h1 class="mb-6 font-display text-xl font-bold text-ink">Users</h1>

<input
  type="search"
  bind:value={search}
  placeholder="Search by name, email or phone…"
  class="mb-4 w-full max-w-sm rounded-xl border border-fanu-100 bg-white px-3.5 py-2.5 text-sm focus:border-fanu-500"
/>

<div class="overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each filtered as row (row.email)}
    <AdminUserRow {row} isSelf={row.email === $currentProfile?.email} />
  {:else}
    <p class="px-4 py-10 text-center text-sm text-ink/40">No users match that search.</p>
  {/each}
</div>
