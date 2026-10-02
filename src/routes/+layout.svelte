<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { isLoggedIn, currentProfile } from '$lib/stores/db';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import SideNav from '$lib/components/SideNav.svelte';
  import ToastHost from '$lib/components/ToastHost.svelte';
  import MobileServiceDrawer from '$lib/components/MobileServiceDrawer.svelte';
  import { loadSettings } from '$lib/stores/settings';

  let drawerOpen = false;

  const publicPaths = ['/login', '/register'];

  $: path = $page.url.pathname;
  $: isPublicPath = publicPaths.includes(path);
  $: isAdminPath = path.startsWith('/admin');
  $: needsPhone = $isLoggedIn && $currentProfile !== null && !$currentProfile.phone;

  // Shared admin-managed settings (notification bar, airtime charges) for any signed-in user.
  $: if (browser && $isLoggedIn) loadSettings();

  // Re-evaluates whenever path, login state, or profile changes.
  // Guarded to the browser: goto() throws if called during SSR, and
  // localStorage (which the stores above read from) doesn't exist on
  // the server anyway, so there's nothing correct to redirect on there.
  $: if (browser) {
    if (path === '/') {
      goto($isLoggedIn ? '/dashboard' : '/login', { replaceState: true });
    } else if (!$isLoggedIn && !isPublicPath) {
      goto('/login', { replaceState: true });
    } else if ($isLoggedIn && isPublicPath) {
      goto('/dashboard', { replaceState: true });
    } else if ($isLoggedIn && needsPhone && !isAdminPath && path !== '/complete-profile') {
      goto('/complete-profile', { replaceState: true });
    }
  }
</script>

<ToastHost />

{#if isPublicPath || path === '/' || path === '/complete-profile' || isAdminPath}
  <slot />
{:else}
  <div class="min-h-screen bg-paper md:flex">
    <SideNav />
    <div class="min-h-screen w-full pb-20 md:pb-0">
      <div class="mx-auto max-w-md md:max-w-2xl md:px-8 md:py-6 lg:max-w-3xl">
        <slot />
      </div>
    </div>
  </div>
  <!-- Mobile floating "Services" button — opens the service drawer -->
  <button
    type="button"
    on:click={() => (drawerOpen = true)}
    class="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-full bg-fanu-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg md:hidden"
    aria-label="All services"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
    Services
  </button>
  <MobileServiceDrawer bind:open={drawerOpen} />
  <BottomNav />
{/if}
