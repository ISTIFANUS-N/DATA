<script lang="ts">
  import { page } from '$app/stores';

  const tabs = [
    { href: '/dashboard', label: 'Home', icon: 'home' },
    { href: '/transaction-history', label: 'History', icon: 'history' },
    { href: '/profile', label: 'Profile', icon: 'user' }
  ];

  function isActive(href: string) {
    return $page.url.pathname === href;
  }
</script>

<nav
  class="fixed bottom-0 left-0 right-0 z-40 border-t border-fanu-100 bg-white/95 backdrop-blur print:hidden
         supports-[backdrop-filter]:bg-white/80 md:hidden"
  aria-label="Primary"
>
  <div class="mx-auto flex max-w-md items-stretch justify-around px-2 py-1.5">
    {#each tabs as tab}
      <a
        href={tab.href}
        class="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors"
        class:text-fanu-600={isActive(tab.href)}
        class:text-ink={!isActive(tab.href)}
        class:opacity-60={!isActive(tab.href)}
        aria-current={isActive(tab.href) ? 'page' : undefined}
      >
        <span
          class="flex h-8 w-8 items-center justify-center rounded-full"
          class:bg-fanu-50={isActive(tab.href)}
        >
          {#if tab.icon === 'home'}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>
          {:else if tab.icon === 'history'}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
          {:else}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" /></svg>
          {/if}
        </span>
        {tab.label}
      </a>
    {/each}
  </div>
</nav>
