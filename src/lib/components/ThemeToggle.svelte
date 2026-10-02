<script lang="ts">
  import { theme, toggleTheme } from '$lib/stores/theme';

  // "icon" = round icon-only button; "row" = full-width labelled row (for sidebars)
  export let variant: 'icon' | 'row' = 'icon';

  $: dark = $theme === 'dark';
</script>

{#if variant === 'row'}
  <button
    type="button"
    on:click={toggleTheme}
    class="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-fanu-50"
  >
    {#if dark}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      Light mode
    {:else}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
      Dark mode
    {/if}
  </button>
{:else}
  <button
    type="button"
    on:click={toggleTheme}
    aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    title={dark ? 'Light mode' : 'Dark mode'}
    class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink/70 shadow-sm transition hover:text-ink active:scale-95"
  >
    {#if dark}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
    {:else}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
    {/if}
  </button>
{/if}
