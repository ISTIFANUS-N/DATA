<script lang="ts">
  export let checked: boolean;
  export let label: string;
  export let description = '';
  export let onChange: (value: boolean) => void;
</script>

<div class="flex items-start justify-between gap-3">
  <div>
    <p class="text-xs font-medium text-ink/70">{label}</p>
    {#if description}
      <p class="mt-0.5 text-[11px] text-ink/40">{description}</p>
    {/if}
  </div>
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    on:click={() => onChange(!checked)}
    class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
    class:bg-fanu-600={checked}
    class:bg-ink={!checked}
    style={checked ? '' : 'background-color:#d8d5cd'}
  >
    <span
      class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
      style={checked ? 'transform:translateX(22px)' : 'transform:translateX(2px)'}
    ></span>
  </button>
</div>
