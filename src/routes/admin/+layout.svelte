<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { currentProfile, isLoggedIn, logout } from '$lib/stores/db';
  import { pendingCount } from '$lib/stores/approvals';
  import { disabledServicesCount } from '$lib/stores/serviceStatus';
  import ApiBalanceAlert from '$lib/components/ApiBalanceAlert.svelte';

  // Super admin = role admin + package reseller
  $: isSuperAdmin = $currentProfile?.role === 'admin' && $currentProfile?.package === 'reseller';
  $: isAdmin      = $currentProfile?.role === 'admin';

  // Nav links — superAdminOnly flags which ones are hidden from regular admins
  const allNavLinks = [
    { href: '/admin',             label: 'Overview',       icon: 'grid',    superAdminOnly: false },
    { href: '/admin/transactions',label: 'Transactions',   icon: 'receipt', superAdminOnly: false },
    { href: '/admin/users',       label: 'Users',          icon: 'users',   superAdminOnly: false },
    { href: '/admin/service-status', label: 'Service status', icon: 'toggle', superAdminOnly: false },
    { href: '/admin/analytics',   label: 'Analytics',      icon: 'chart',   superAdminOnly: true  },
    { href: '/admin/approvals',   label: 'Approvals',      icon: 'check',   superAdminOnly: true  },
    { href: '/admin/user-roles',  label: 'User roles',     icon: 'shield',  superAdminOnly: true  },
  ];

  const allServiceLinks = [
    { href: '/admin/data-plans',    label: 'Data plans',       superAdminOnly: false },
    { href: '/admin/cable-plans',   label: 'Cable plans',      superAdminOnly: false },
    { href: '/admin/airtime',       label: 'Airtime',          superAdminOnly: false },
    { href: '/admin/electricity',   label: 'Electricity',      superAdminOnly: false },
    { href: '/admin/bulk-sms',      label: 'Bulk SMS',         superAdminOnly: false },
    { href: '/admin/result-checker',label: 'Result checker',   superAdminOnly: false },
    { href: '/admin/recharge-cards',label: 'Recharge cards',   superAdminOnly: false },
    { href: '/admin/api-management',label: 'API management',   superAdminOnly: true  },
  ];

  // Filter links based on role
  $: navLinks     = allNavLinks.filter(l => !l.superAdminOnly || isSuperAdmin);
  $: serviceLinks = allServiceLinks.filter(l => !l.superAdminOnly || isSuperAdmin);

  $: path = $page.url.pathname;
  $: isActive = (href: string) => (href === '/admin' ? path === '/admin' : path.startsWith(href));

  // Client-side guard: redirect non-admins away
  $: if (browser && (!$isLoggedIn || !isAdmin)) {
    goto('/dashboard', { replaceState: true });
  }

  // Client-side guard: redirect regular admins away from super-admin-only pages
  $: if (browser && isAdmin && !isSuperAdmin) {
    const superOnlyPaths = ['/admin/analytics', '/admin/approvals', '/admin/user-roles', '/admin/api-management'];
    if (superOnlyPaths.some(p => path.startsWith(p))) {
      goto('/admin', { replaceState: true });
    }
  }

  function handleLogout() {
    logout();
    goto('/login');
  }
</script>

{#if isAdmin}
  <div class="min-h-screen bg-paper md:flex">
    <aside class="flex w-full flex-col border-b border-fanu-100 bg-white px-5 py-4 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r md:py-6 md:sticky md:top-0 md:overflow-y-auto">

      <div class="mb-6 flex items-center justify-between md:mb-8 md:block">
        <a href="/admin" class="flex items-center gap-2.5">
          <img src="/stefanx-icon.png" alt="" class="h-8 w-8 rounded-lg" />
          <div>
            <p class="font-display text-sm font-bold text-fanu-700">Stefanx</p>
            <p class="text-[10px] font-medium uppercase tracking-wide text-ink/40">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </p>
          </div>
        </a>
        <a href="/dashboard" class="text-xs font-medium text-ink/50 hover:text-ink md:hidden">Exit</a>
      </div>

      <!-- Main nav -->
      <nav class="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {#each navLinks as link}
          <a href={link.href}
            class="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition"
            class:bg-fanu-50={isActive(link.href)}
            class:text-fanu-700={isActive(link.href)}
            class:text-ink={!isActive(link.href)}
          >
            {#if link.icon === 'grid'}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>
            {:else if link.icon === 'receipt'}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2h16v20l-2-1-2 1-2-1-2 1-2-1-2 1-2-1V2z"/><path d="M8 7h8M8 11h8M8 15h4"/></svg>
            {:else if link.icon === 'chart'}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>
            {:else if link.icon === 'shield'}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            {:else if link.icon === 'toggle'}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="4" fill="currentColor" stroke="none"/></svg>
            {:else if link.icon === 'check'}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
            {:else}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3 3-5.5 7-5.5s7 2.5 7 5.5"/><path d="M17 8.5a3 3 0 1 1 3.5 3"/><path d="M20 14c1.8.6 3 2.2 3 4.2"/></svg>
            {/if}
            {link.label}
            {#if link.icon === 'check' && $pendingCount > 0}
              <span class="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-spark-500 text-[9px] font-bold text-white">{$pendingCount}</span>
            {/if}
            {#if link.icon === 'toggle' && $disabledServicesCount > 0}
              <span class="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">{$disabledServicesCount}</span>
            {/if}
          </a>
        {/each}
      </nav>

      <!-- Service links -->
      <p class="mb-1 mt-5 hidden px-3 text-[10px] font-semibold uppercase tracking-widest text-ink/35 md:block">Services</p>
      <nav class="hidden flex-col gap-0.5 md:flex">
        {#each serviceLinks as link}
          <a href={link.href}
            class="rounded-xl px-3 py-2 text-sm font-medium transition"
            class:bg-fanu-50={isActive(link.href)}
            class:text-fanu-700={isActive(link.href)}
            class:text-ink={!isActive(link.href)}
            class:opacity-70={!isActive(link.href)}
          >{link.label}</a>
        {/each}
      </nav>

      <!-- Mobile service pills -->
      <div class="mt-3 flex gap-1 overflow-x-auto pb-1 md:hidden">
        {#each serviceLinks as link}
          <a href={link.href}
            class="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition"
            class:border-fanu-500={isActive(link.href)}
            class:bg-fanu-50={isActive(link.href)}
            class:text-fanu-700={isActive(link.href)}
            class:border-fanu-100={!isActive(link.href)}
            class:text-ink={!isActive(link.href)}
          >{link.label}</a>
        {/each}
      </div>

      <div class="mt-auto hidden flex-col gap-2 pt-8 md:flex">
        <a href="/dashboard" class="text-xs font-medium text-ink/50 hover:text-ink">← Back to customer app</a>
        <button type="button" on:click={handleLogout} class="text-left text-xs font-medium text-red-500 hover:underline">
          Sign out
        </button>
      </div>
    </aside>

    <div class="min-h-screen w-full">
      <ApiBalanceAlert />
      <div class="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <slot />
      </div>
    </div>
  </div>
{/if}
