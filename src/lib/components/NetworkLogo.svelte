<script lang="ts">
  import BrandLogo from './BrandLogo.svelte';
  export let network: string;
  export let size: 'sm' | 'md' | 'lg' = 'md';
</script>

<BrandLogo code={network} {size} />
