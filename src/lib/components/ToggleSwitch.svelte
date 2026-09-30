<script lang="ts">
  export let checked: boolean;
  export let label: string;
  export let description = '';
  export let onChange: (value: boolean) => void;
</script>

<div class="flex items-start justify-between gap-3">
  <div class="min-w-0">
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
    class="relative flex h-6 w-20 shrink-0 items-center rounded-full transition-colors"
    style={checked ? 'background:#166029' : 'background:#d8d5cd'}
  >
    <!-- Text labels inside the track -->
    <span
      class="absolute left-1.5 text-[9px] font-bold leading-none transition-opacity"
      class:opacity-100={checked}
      class:opacity-0={!checked}
      style="color:rgba(255,255,255,0.9)"
    >ON</span>
    <span
      class="absolute right-1.5 text-[9px] font-bold leading-none transition-opacity"
      class:opacity-100={!checked}
      class:opacity-0={checked}
      style="color:rgba(22,33,26,0.55)"
    >OFF</span>
    <!-- Knob -->
    <span
      class="absolute h-5 w-5 rounded-full bg-white shadow transition-transform"
      style={checked ? 'transform:translateX(52px);top:2px' : 'transform:translateX(2px);top:2px'}
    ></span>
  </button>
</div>
