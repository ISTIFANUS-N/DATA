<script lang="ts">
  import { resultPins, adminUpdateResultPin } from '$lib/stores/catalog';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira } from '$lib/format';
  import type { ResultCheckerPin } from '$lib/data/catalog';

  let drafts: Record<string, { label: string; price: number }> = {};

  function save(id: string, pin: ResultCheckerPin) {
    const d = drafts[id];
    if (!d) return;
    adminUpdateResultPin(id, d);
    showToast(`${pin.type} PIN updated`);
    delete drafts[id];
  }
</script>

<svelte:head><title>Result checker pins — Admin</title></svelte:head>

<h1 class="mb-2 font-display text-xl font-bold text-ink">Result checker pins</h1>
<p class="mb-6 text-sm text-ink/55">Set pricing and display labels for each exam type.</p>

<div class="overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each $resultPins as pin (pin.id)}
    <div class="border-b border-fanu-50 px-4 py-4 last:border-0">
      <p class="mb-3 font-semibold text-ink">{pin.type}</p>
      <div class="grid grid-cols-2 gap-3">
        <label class="flex flex-col gap-1 text-xs">
          <span class="font-medium text-ink/60">Display label</span>
          <input type="text" value={drafts[pin.id]?.label ?? pin.label}
            on:input={(e) => (drafts[pin.id] = { ...(drafts[pin.id] ?? { label: pin.label, price: pin.price }), label: e.currentTarget.value })}
            class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" />
        </label>
        <label class="flex flex-col gap-1 text-xs">
          <span class="font-medium text-ink/60">Price (₦)</span>
          <input type="number" min="0" value={drafts[pin.id]?.price ?? pin.price}
            on:input={(e) => (drafts[pin.id] = { ...(drafts[pin.id] ?? { label: pin.label, price: pin.price }), price: +e.currentTarget.value })}
            class="rounded-lg border border-fanu-100 px-2.5 py-2 text-sm" />
        </label>
      </div>
      {#if drafts[pin.id]}
        <button type="button" on:click={() => save(pin.id, pin)} class="mt-2 rounded-lg bg-fanu-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-fanu-700">Save</button>
      {/if}
    </div>
  {/each}
</div>
