<script context="module" lang="ts">
  // Remembers which official logo file (if any) exists, so each one is only probed once per visit.
  const found: Record<string, 'svg' | 'png' | 'none'> = {};
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { brandFor } from '$lib/data/brands';
  import { NETWORKS } from '$lib/data/catalog';

  export let code: string;
  export let size: 'sm' | 'md' | 'lg' = 'md';

  const sizes = { sm: 32, md: 44, lg: 60 };

  // Official logo files (static/logos/<code>.svg, then .png) win; the badge shows until/unless one loads.
  let ext: 'svg' | 'png' = 'svg';
  let loaded = false;
  let failed = false;
  // Only load logo files once running in the browser, so load/error events can't fire before we listen.
  let mounted = false;
  onMount(() => (mounted = true));
  let lastCode = '';
  $: if (code !== lastCode) {
    lastCode = code;
    const known = found[code];
    ext = known === 'png' ? 'png' : 'svg';
    failed = known === 'none';
    loaded = false;
  }

  function onError() {
    if (ext === 'svg') ext = 'png';
    else { failed = true; found[code] = 'none'; }
  }

  function onLoad() {
    loaded = true;
    found[code] = ext;
  }

  $: px = sizes[size];
  $: brand = brandFor(code);
  $: networkMark = NETWORKS.find((n) => n.code === code)?.logo;
  $: fontSize = Math.max(8, Math.min(13, Math.round((px * 0.9) / Math.max(brand.short.length, 3))));
</script>

<span
  class="relative inline-block shrink-0 overflow-hidden rounded-xl"
  style="width:{px}px;height:{px}px"
  role="img"
  aria-label={brand.label}
>
  {#if networkMark}
    {@html networkMark}
  {:else}
    <span
      class="flex h-full w-full items-center justify-center text-center font-display font-extrabold leading-none"
      style="background:linear-gradient(145deg,{brand.bg},{brand.bg}cc);color:{brand.fg};font-size:{fontSize}px"
    >{brand.short}</span>
  {/if}

  {#if mounted && !failed}
    {#key ext}
      <img
        src="/logos/{code.toLowerCase()}.{ext}"
        alt=""
        class="absolute inset-0 h-full w-full object-contain p-1 transition-opacity"
        style="background:#fff;opacity:{loaded ? 1 : 0}"
        on:load={onLoad}
        on:error={onError}
      />
    {/key}
  {/if}
</span>
