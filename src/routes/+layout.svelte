<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { isLoggedIn, currentProfile } from '$lib/stores/db';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import SideNav from '$lib/components/SideNav.svelte';
  import ToastHost from '$lib/components/ToastHost.svelte';
  import { loadSettings } from '$lib/stores/settings';

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
  <div class="min-h-screen md:flex">
    <SideNav />
    <div class="min-h-screen w-full pb-20 md:pb-0">
      <div class="mx-auto max-w-md md:max-w-2xl md:px-8 md:py-6 lg:max-w-3xl">
        <slot />
      </div>
    </div>
  </div>
  <BottomNav />
{/if}
