<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let title: string;
  export let showBack = true;
  export let showMenu = true; // hamburger for mobile service drawer

  const dispatch = createEventDispatcher<{ menu: void }>();
</script>

<header class="sticky top-0 z-30 flex items-center gap-2 border-b border-fanu-100 bg-paper/95 px-4 py-3.5 backdrop-blur print:hidden">
  {#if showBack}
    <button
      on:click={() => history.back()}
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/70 hover:bg-fanu-50"
      aria-label="Go back"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  {/if}
  <h1 class="flex-1 font-display text-[17px] font-semibold text-ink">{title}</h1>
  {#if showMenu}
    <button
      type="button"
      on:click={() => dispatch('menu')}
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/60 hover:bg-fanu-50 md:hidden"
      aria-label="Services menu"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>
  {/if}
</header>
