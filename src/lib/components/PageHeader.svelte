<script lang="ts">
  export let title: string;
  export let showBack = true;
</script>

<header class="sticky top-0 z-30 flex items-center gap-3 border-b border-fanu-100 bg-paper/95 px-4 py-3.5 backdrop-blur print:hidden">
  {#if showBack}
    <button
      on:click={() => history.back()}
      class="flex h-8 w-8 items-center justify-center rounded-full text-ink/70 hover:bg-fanu-50"
      aria-label="Go back"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  {/if}
  <h1 class="font-display text-[17px] font-semibold text-ink">{title}</h1>
</header>
