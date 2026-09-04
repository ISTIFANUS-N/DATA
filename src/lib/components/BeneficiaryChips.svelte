<script lang="ts">
  import type { Beneficiary } from '$lib/types';

  export let items: Beneficiary[];
  export let onSelect: (b: Beneficiary) => void;
</script>

{#if items.length > 0}
  <div class="mb-4 flex gap-2 overflow-x-auto pb-1">
    {#each items as b (b.id)}
      <button
        type="button"
        on:click={() => onSelect(b)}
        class="flex shrink-0 flex-col items-start gap-0.5 rounded-xl border border-fanu-100 bg-white px-3 py-2 text-left transition hover:border-fanu-400 hover:bg-fanu-50"
      >
        <span class="text-xs font-semibold text-ink">{b.name}</span>
        <span class="text-[10px] text-ink/45">{b.value}</span>
      </button>
    {/each}
  </div>
{/if}
