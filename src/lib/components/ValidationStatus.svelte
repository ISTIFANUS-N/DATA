<script lang="ts">
  export let state: 'idle' | 'validating' | 'valid' | 'invalid';
  export let customerName = '';
  export let error = '';
</script>

{#if state === 'validating'}
  <div class="mb-5 flex items-center gap-2 rounded-xl bg-ink/5 px-3.5 py-2.5 text-xs text-ink/60">
    <span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/20 border-t-ink/60"></span>
    Verifying account…
  </div>
{:else if state === 'valid'}
  <div class="mb-5 flex items-center gap-2 rounded-xl bg-fanu-50 px-3.5 py-2.5 text-xs font-medium text-fanu-700">
    <span>✓</span>
    {customerName}
  </div>
{:else if state === 'invalid'}
  <div class="mb-5 flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">
    <span>✕</span>
    {error || 'Could not verify this number.'}
  </div>
{/if}
