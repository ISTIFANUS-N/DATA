<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { currentProfile, logout } from '$lib/stores/db';

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/transaction-history', label: 'Transaction history', icon: 'history' },
    { href: '/profile', label: 'Profile', icon: 'user' }
  ];

  const serviceLinks = [
    { href: '/buy-data', label: 'Buy data' },
    { href: '/buy-airtime', label: 'Buy airtime' },
    { href: '/tv-subscription', label: 'Cable TV' },
    { href: '/electricity-bill', label: 'Electricity' },
    { href: '/airtime-to-cash', label: 'Airtime to cash' },
    { href: '/recharge-card-printing', label: 'Recharge card printing' },
    { href: '/bulk-sms', label: 'Bulk SMS' },
    { href: '/result-checker', label: 'Result checker' }
  ];

  $: isActive = (href: string) => $page.url.pathname === href;

  async function handleLogout() {
    await logout();
    goto('/login');
  }
</script>

<aside
  class="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-fanu-100 bg-white px-5 py-6 md:flex print:hidden"
>
  <a href="/dashboard" class="mb-8 flex items-center gap-2.5">
    <img src="/stefanx-icon.png" alt="" class="h-8 w-8 rounded-lg" />
    <span class="font-display text-base font-bold text-fanu-700">Stefanx</span>
  </a>

  <nav class="flex flex-col gap-1">
    {#each navLinks as link}
      <a
        href={link.href}
        class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition"
        class:bg-fanu-50={isActive(link.href)}
        class:text-fanu-700={isActive(link.href)}
        class:text-ink={!isActive(link.href)}
      >
        {#if link.icon === 'home'}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>
        {:else if link.icon === 'history'}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
        {:else}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" /></svg>
        {/if}
        {link.label}
      </a>
    {/each}
  </nav>

  <p class="mb-2 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink/40">
    Services
  </p>
  <nav class="flex flex-col gap-1">
    {#each serviceLinks as link}
      <a
        href={link.href}
        class="rounded-xl px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-fanu-50"
        class:bg-fanu-50={isActive(link.href)}
        class:text-fanu-700={isActive(link.href)}
      >
        {link.label}
      </a>
    {/each}
  </nav>

  {#if $currentProfile?.role === 'admin'}
    <a
      href="/admin"
      class="mt-8 flex items-center gap-2 rounded-xl bg-ink/5 px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-ink/10"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 3 6v6c0 5 4 8.5 9 10 5-1.5 9-5 9-10V6l-9-4Z" /></svg>
      Admin dashboard
    </a>
  {/if}

  <button
    type="button"
    on:click={handleLogout}
    class="mt-auto flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
    Log out
  </button>
</aside>
