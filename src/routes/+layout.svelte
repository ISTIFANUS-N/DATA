<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { isLoggedIn, currentProfile, ensureGuestSession } from '$lib/stores/db';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import SideNav from '$lib/components/SideNav.svelte';
  import ToastHost from '$lib/components/ToastHost.svelte';

  // TEMPORARY: set to false to skip the login requirement entirely so
  // the frontend can be browsed/demoed freely — anyone landing on the
  // app is auto-signed into a shared local "Guest" account instead of
  // being sent to /login. Flip this back to true once real accounts
  // (Supabase Auth) are wired in and sign-in should be enforced again.
  const AUTH_REQUIRED = false;

  const publicPaths = ['/login', '/register'];

  $: path = $page.url.pathname;
  $: isPublicPath = publicPaths.includes(path);
  $: needsPhone = $isLoggedIn && $currentProfile !== null && !$currentProfile.phone;

  // Re-evaluates whenever path, login state, or profile changes.
  // Guarded to the browser: goto() throws if called during SSR, and
  // localStorage (which the stores above read from) doesn't exist on
  // the server anyway, so there's nothing correct to redirect on there.
  $: if (browser) {
    if (!AUTH_REQUIRED) {
      if (!$isLoggedIn) {
        ensureGuestSession();
      } else if (path === '/') {
        goto('/dashboard', { replaceState: true });
      }
    } else if (path === '/') {
      goto($isLoggedIn ? '/dashboard' : '/login', { replaceState: true });
    } else if (!$isLoggedIn && !isPublicPath) {
      goto('/login', { replaceState: true });
    } else if ($isLoggedIn && isPublicPath) {
      goto('/dashboard', { replaceState: true });
    } else if ($isLoggedIn && needsPhone && path !== '/complete-profile') {
      goto('/complete-profile', { replaceState: true });
    }
  }
</script>

<ToastHost />

{#if isPublicPath || path === '/' || path === '/complete-profile'}
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
  <BottomNav />
{/if}
