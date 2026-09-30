<script lang="ts">
  import { NETWORKS } from '$lib/data/catalog';
  export let network: string;
  export let size: 'sm' | 'md' | 'lg' = 'md';

  const sizes = { sm: 32, md: 44, lg: 60 };
  $: net = NETWORKS.find(n => n.code === network);
  $: px = sizes[size];
</script>

{#if net}
  <div
    class="overflow-hidden rounded-xl flex-shrink-0"
    style="width:{px}px;height:{px}px"
  >
    {@html net.logo}
  </div>
{:else}
  <div
    class="flex items-center justify-center rounded-xl bg-ink/10 text-xs font-bold text-ink/50 flex-shrink-0"
    style="width:{px}px;height:{px}px"
  >
    {network}
  </div>
{/if}
