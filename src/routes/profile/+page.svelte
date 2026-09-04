<script lang="ts">
  import { goto } from '$app/navigation';
  import { currentProfile, walletBalance, logout, beneficiaries, removeBeneficiary, switchPackage } from '$lib/stores/db';
  import { formatNaira } from '$lib/format';
  import { packageLabel } from '$lib/pricing';
  import PageHeader from '$lib/components/PageHeader.svelte';

  function handleLogout() {
    logout();
    goto('/login');
  }

  const kindLabels = { phone: 'Phone', meter: 'Meter', smartcard: 'Smartcard' };
</script>

<svelte:head><title>Profile — Stefanx</title></svelte:head>

<PageHeader title="Profile" showBack={false} />

<div class="px-4 py-5">
  {#if $currentProfile}
    <div class="mb-5 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-fanu-100 font-display text-lg font-semibold text-fanu-700">
        {$currentProfile.fullName ? $currentProfile.fullName[0].toUpperCase() : '?'}
      </div>
      <div>
        <p class="font-semibold text-ink">{$currentProfile.fullName || 'Stefanx user'}</p>
        <p class="text-xs text-ink/50">{$currentProfile.email}</p>
      </div>
    </div>

    <div class="mb-5 divide-y divide-fanu-50 rounded-2xl bg-white px-4 shadow-sm">
      <div class="flex items-center justify-between py-3">
        <span class="text-sm text-ink/60">Phone number</span>
        <span class="text-sm font-medium text-ink">{$currentProfile.phone || '—'}</span>
      </div>
      <div class="flex items-center justify-between py-3">
        <span class="text-sm text-ink/60">Wallet balance</span>
        <span class="font-mono text-sm font-medium tabular-nums text-ink">{formatNaira($walletBalance)}</span>
      </div>
      <div class="flex items-center justify-between py-3">
        <span class="text-sm text-ink/60">Signed in with</span>
        <span class="text-sm font-medium capitalize text-ink">{$currentProfile.authProvider}</span>
      </div>
    </div>

    <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">Account type</p>
    <div class="mb-5 rounded-2xl bg-white p-4 shadow-sm">
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          on:click={() => switchPackage('smart_user')}
          class="rounded-xl border py-3 text-left transition"
          class:border-fanu-500={$currentProfile.package === 'smart_user'}
          class:bg-fanu-50={$currentProfile.package === 'smart_user'}
          class:border-fanu-100={$currentProfile.package !== 'smart_user'}
        >
          <p class="px-3 text-sm font-semibold text-ink">Smart User</p>
          <p class="px-3 text-[11px] text-ink/45">Standard retail pricing</p>
        </button>
        <button
          type="button"
          on:click={() => switchPackage('reseller')}
          class="rounded-xl border py-3 text-left transition"
          class:border-fanu-500={$currentProfile.package === 'reseller'}
          class:bg-fanu-50={$currentProfile.package === 'reseller'}
          class:border-fanu-100={$currentProfile.package !== 'reseller'}
        >
          <p class="px-3 text-sm font-semibold text-ink">Reseller</p>
          <p class="px-3 text-[11px] text-ink/45">Wholesale pricing on data & cable</p>
        </button>
      </div>
      <p class="mt-3 text-[11px] text-ink/40">
        Currently on <span class="font-medium text-ink/60">{packageLabel($currentProfile.package)}</span> pricing.
      </p>
    </div>
  {/if}

  {#if $beneficiaries.length > 0}
    <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">Beneficiaries</p>
    <div class="mb-5 divide-y divide-fanu-50 rounded-2xl bg-white px-4 shadow-sm">
      {#each $beneficiaries as b (b.id)}
        <div class="flex items-center justify-between py-3">
          <div>
            <p class="text-sm font-medium text-ink">{b.name}</p>
            <p class="text-[11px] text-ink/45">{kindLabels[b.kind]} · {b.value}{b.extra ? ` · ${b.extra}` : ''}</p>
          </div>
          <button
            type="button"
            on:click={() => removeBeneficiary(b.id)}
            class="text-xs font-medium text-red-500 hover:underline"
          >
            Remove
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <button
    type="button"
    on:click={handleLogout}
    class="w-full rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
  >
    Sign out
  </button>

  <p class="mt-6 text-center text-[11px] text-ink/40">
    Demo mode — running on mock data. Connect Supabase to go live.
  </p>
</div>
