<script lang="ts">
  import { onMount } from 'svelte';
  import { normalizePhone } from '$lib/network';

  export let value = '';
  export let placeholder = '08012345678';
  export let pattern: string | undefined = undefined;

  // The Contact Picker is available in Chrome on Android (not iPhone Safari), so only show the button there.
  let supported = false;
  onMount(() => {
    supported = typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;
  });

  async function pickContact() {
    try {
      const picked = await (navigator as any).contacts.select(['tel'], { multiple: false });
      const tel = picked?.[0]?.tel?.[0];
      if (tel) value = normalizePhone(String(tel));
    } catch {
      // Cancelled, or permission declined: leave the number as it is.
    }
  }
</script>

<div class="relative">
  <input
    type="tel"
    bind:value
    {placeholder}
    {pattern}
    class="w-full rounded-xl border border-fanu-100 py-3 text-sm focus:border-fanu-500"
    class:pl-3.5={true}
    class:pr-12={supported}
    class:pr-3.5={!supported}
  />
  {#if supported}
    <button
      type="button"
      on:click={pickContact}
      aria-label="Choose from contacts"
      title="Choose from contacts"
      class="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-fanu-50 text-fanu-700 transition active:scale-95"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    </button>
  {/if}
</div>
