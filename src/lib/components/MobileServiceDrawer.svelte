<script lang="ts">
  import { page } from '$app/stores';

  export let open = false;

  const services = [
    { href: '/buy-data',              label: 'Buy data',             icon: '📶' },
    { href: '/buy-airtime',           label: 'Buy airtime',          icon: '📱' },
    { href: '/tv-subscription',       label: 'Cable TV',             icon: '📺' },
    { href: '/electricity-bill',      label: 'Electricity',          icon: '💡' },
    { href: '/airtime-to-cash',       label: 'Airtime to cash',      icon: '🔄' },
    { href: '/recharge-card-printing',label: 'Recharge cards',       icon: '🖨️' },
    { href: '/bulk-sms',              label: 'Bulk SMS',             icon: '💬' },
    { href: '/result-checker',        label: 'Result checker',       icon: '📋' }
  ];

  $: path = $page.url.pathname;
</script>

{#if open}
  <!-- Backdrop -->
  <button
    type="button"
    class="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm md:hidden"
    on:click={() => (open = false)}
    aria-label="Close menu"
  ></button>

  <!-- Drawer -->
  <div class="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white px-5 pt-5 pb-10 shadow-2xl md:hidden"
    style="max-height:80vh;overflow-y:auto">
    <div class="mb-4 flex items-center justify-between">
      <p class="font-display text-sm font-bold text-ink">Services</p>
      <button type="button" on:click={() => (open = false)}
        class="flex h-7 w-7 items-center justify-center rounded-full bg-fanu-50 text-ink/60">
        ✕
      </button>
    </div>

    <div class="grid grid-cols-4 gap-3">
      {#each services as svc}
        <a href={svc.href} on:click={() => (open = false)}
          class="flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-center transition"
          class:border-fanu-500={path === svc.href}
          class:bg-fanu-50={path === svc.href}
          class:border-fanu-100={path !== svc.href}
        >
          <span class="text-2xl">{svc.icon}</span>
          <span class="text-[10px] font-medium leading-tight text-ink/80">{svc.label}</span>
        </a>
      {/each}
    </div>

    <div class="mt-5 flex flex-col gap-1.5">
      <a href="/transaction-history" on:click={() => (open = false)}
        class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-fanu-50">
        🕐 Transaction history
      </a>
      <a href="/profile" on:click={() => (open = false)}
        class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-fanu-50">
        👤 Profile & settings
      </a>
    </div>
  </div>
{/if}
