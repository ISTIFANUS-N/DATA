<script lang="ts">
  import { saveBeneficiary } from '$lib/stores/db';
  import type { BeneficiaryKind } from '$lib/types';

  export let kind: BeneficiaryKind;
  export let value: string;
  export let extra: string | undefined = undefined;
  export let valueLabel: string; // e.g. "08012345678" already formatted for display
  export let onDone: () => void;

  let name = '';
  let saved = false;

  function handleSave() {
    if (!name.trim()) return;
    saveBeneficiary({ kind, name, value, extra });
    saved = true;
    setTimeout(onDone, 700);
  }
</script>

<div class="rounded-2xl border border-dashed border-fanu-200 bg-fanu-50/60 p-4">
  {#if saved}
    <p class="text-center text-sm font-medium text-fanu-700">Saved as "{name}" ✓</p>
  {:else}
    <p class="mb-2 text-sm font-medium text-ink">Save {valueLabel} as a beneficiary?</p>
    <p class="mb-3 text-xs text-ink/50">Give it a name so you can pick it quickly next time.</p>
    <div class="flex gap-2">
      <input
        type="text"
        bind:value={name}
        placeholder="e.g. Mum, Home meter, John"
        class="flex-1 rounded-lg border border-fanu-100 bg-white px-3 py-2 text-sm focus:border-fanu-500"
      />
      <button
        type="button"
        on:click={handleSave}
        disabled={!name.trim()}
        class="rounded-lg bg-fanu-600 px-3.5 text-xs font-semibold text-white disabled:opacity-40"
      >
        Save
      </button>
    </div>
    <button type="button" on:click={onDone} class="mt-2 text-xs text-ink/40 hover:underline">
      Skip
    </button>
  {/if}
</div>
