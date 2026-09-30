<script lang="ts">
  import {
    serviceToggles, adminToggleService, adminSetServiceReason,
    disabledServicesCount, type ServiceKey
  } from '$lib/stores/serviceStatus';
  import {
    dataPlans, cablePlans, airtimeSettings, discoSettings,
    smsPackages, resultPins, rechargeDenominations,
    adminToggleDataPlan, adminToggleCablePlan,
    adminToggleNetworkDataPlans, adminTogglePlanType,
    adminToggleCableProvider, adminToggleSmsPackage,
    adminToggleResultPin, adminUpdateAirtimeSetting, adminUpdateDisco,
    adminUpdateRechargeDenom
  } from '$lib/stores/catalog';
  import { NETWORKS, DATA_PLAN_TYPES } from '$lib/data/catalog';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira } from '$lib/format';

  let editingReasonKey: ServiceKey | null = null;
  let reasonDraft = '';

  function toggleService(key: ServiceKey, val: boolean) {
    adminToggleService(key, val);
    showToast(val ? 'Service enabled' : 'Service disabled — customers will see the unavailable message');
  }

  function saveReason(key: ServiceKey) {
    adminSetServiceReason(key, reasonDraft);
    editingReasonKey = null;
    showToast('Message updated');
  }

  const providers = ['DSTV', 'GOTV', 'STARTIMES'] as const;
</script>

<svelte:head><title>Service status — Admin</title></svelte:head>

<div class="mb-6 flex items-center justify-between">
  <div>
    <h1 class="font-display text-xl font-bold text-ink">Service status</h1>
    <p class="text-sm text-ink/55">
      Enable or disable services and sub-options. Disabled services show your message to customers.
      {#if $disabledServicesCount > 0}
        <span class="ml-1 font-semibold text-amber-700">{$disabledServicesCount} service{$disabledServicesCount > 1 ? 's' : ''} currently disabled.</span>
      {/if}
    </p>
  </div>
</div>

<!-- ── TOP-LEVEL SERVICES ── -->
<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Top-level services</p>
<div class="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each $serviceToggles as svc (svc.key)}
    <div class="border-b border-fanu-50 px-4 py-3 last:border-0">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-sm text-ink">{svc.label}</p>
          {#if !svc.isEnabled}
            <p class="text-[11px] text-amber-700 mt-0.5 truncate">"{svc.disabledReason}"</p>
          {/if}
        </div>
        <div class="flex shrink-0 items-center gap-3">
          {#if !svc.isEnabled}
            <button
              type="button"
              on:click={() => { editingReasonKey = svc.key; reasonDraft = svc.disabledReason; }}
              class="text-[11px] font-medium text-ink/40 hover:text-ink"
            >Edit message</button>
          {/if}
          <label class="flex cursor-pointer items-center gap-2">
            <span class="text-xs font-medium" class:text-fanu-700={svc.isEnabled} class:text-red-600={!svc.isEnabled}>
              {svc.isEnabled ? 'On' : 'Off'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={svc.isEnabled}
              on:click={() => toggleService(svc.key, !svc.isEnabled)}
              class="relative h-6 w-11 rounded-full transition-colors"
              style={svc.isEnabled ? 'background:#1F7A34' : 'background:#d8d5cd'}
            >
              <span
                class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={svc.isEnabled ? 'transform:translateX(22px)' : 'transform:translateX(2px)'}
              ></span>
            </button>
          </label>
        </div>
      </div>
      {#if editingReasonKey === svc.key}
        <div class="mt-3 flex gap-2">
          <input
            type="text"
            bind:value={reasonDraft}
            placeholder="Message shown to customers when disabled"
            class="flex-1 rounded-lg border border-fanu-100 px-3 py-2 text-xs focus:border-fanu-500"
          />
          <button type="button" on:click={() => saveReason(svc.key)} class="rounded-lg bg-fanu-600 px-3 py-2 text-xs font-semibold text-white">Save</button>
          <button type="button" on:click={() => (editingReasonKey = null)} class="rounded-lg border border-fanu-100 px-3 py-2 text-xs font-semibold text-ink/60">Cancel</button>
        </div>
      {/if}
    </div>
  {/each}
</div>

<!-- ── DATA: PER-NETWORK BULK TOGGLE ── -->
<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Data — by network</p>
<div class="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each NETWORKS as net}
    {@const netPlans = $dataPlans.filter(p => p.network === net.code)}
    {@const allOn = netPlans.every(p => p.isActive)}
    {@const anyOn = netPlans.some(p => p.isActive)}
    <div class="flex items-center justify-between border-b border-fanu-50 px-4 py-3 last:border-0">
      <div class="flex items-center gap-2.5">
        <span class="h-4 w-4 rounded-full" style="background:{net.color}"></span>
        <span class="text-sm font-semibold text-ink">{net.label}</span>
        <span class="text-[11px] text-ink/40">{netPlans.filter(p => p.isActive).length}/{netPlans.length} plans active</span>
      </div>
      <button
        type="button"
        on:click={() => { adminToggleNetworkDataPlans(net.code, !allOn); showToast(`${net.label} data plans ${allOn ? 'disabled' : 'enabled'}`); }}
        class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
        class:border-fanu-500={allOn}
        class:bg-fanu-50={allOn}
        class:text-fanu-700={allOn}
        class:border-fanu-100={!allOn}
        class:text-ink={!allOn}
      >{allOn ? 'Disable all' : 'Enable all'}</button>
    </div>
  {/each}
</div>

<!-- ── DATA: PER-PLAN-TYPE BULK TOGGLE ── -->
<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Data — by plan type</p>
<div class="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each DATA_PLAN_TYPES as pt}
    {@const typePlans = $dataPlans.filter(p => p.type === pt.code)}
    {@const allOn = typePlans.every(p => p.isActive)}
    <div class="flex items-center justify-between border-b border-fanu-50 px-4 py-3 last:border-0">
      <div>
        <p class="text-sm font-semibold text-ink">{pt.label}</p>
        <p class="text-[11px] text-ink/40">{typePlans.filter(p => p.isActive).length}/{typePlans.length} plans active across all networks</p>
      </div>
      <button
        type="button"
        on:click={() => { adminTogglePlanType(pt.code, !allOn); showToast(`${pt.label} plans ${allOn ? 'disabled' : 'enabled'} across all networks`); }}
        class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
        class:border-fanu-500={allOn}
        class:bg-fanu-50={allOn}
        class:text-fanu-700={allOn}
        class:border-fanu-100={!allOn}
        class:text-ink={!allOn}
      >{allOn ? 'Disable all' : 'Enable all'}</button>
    </div>
  {/each}
</div>

<!-- ── DATA: INDIVIDUAL PLANS ── -->
<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Data — individual plans</p>
<div class="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each NETWORKS as net}
    <div class="border-b border-fanu-100 bg-fanu-50/40 px-4 py-2">
      <p class="text-xs font-bold text-ink/50">{net.label}</p>
    </div>
    {#each $dataPlans.filter(p => p.network === net.code) as plan (plan.id)}
      <div class="flex items-center justify-between border-b border-fanu-50 px-4 py-2.5 last:border-0">
        <div class="min-w-0">
          <p class="font-mono text-sm font-bold text-ink" style={!plan.isActive ? 'opacity:0.4' : ''}>{plan.sizeValue}{plan.sizeUnit}</p>
          <p class="text-[11px] text-ink/40">{plan.validity} · {(DATA_PLAN_TYPES.find(t => t.code === plan.type) || { label: '' }).label}</p>
        </div>
        <div class="flex shrink-0 items-center gap-3">
          <span class="font-mono text-xs tabular-nums text-ink/60">{formatNaira(plan.price)}</span>
          <button
            type="button"
            role="switch"
            aria-checked={plan.isActive}
            on:click={() => { adminToggleDataPlan(plan.id, !plan.isActive); showToast(`${plan.sizeValue}${plan.sizeUnit} ${plan.isActive ? 'disabled' : 'enabled'}`);  }}
            class="relative h-5 w-9 rounded-full transition-colors"
            style={plan.isActive ? 'background:#1F7A34' : 'background:#d8d5cd'}
          >
            <span class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
              style={plan.isActive ? 'transform:translateX(17px)' : 'transform:translateX(2px)'}></span>
          </button>
        </div>
      </div>
    {/each}
  {/each}
</div>

<!-- ── CABLE: PER-PROVIDER ── -->
<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Cable TV — by provider</p>
<div class="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each providers as prov}
    {@const provPlans = $cablePlans.filter(p => p.provider === prov)}
    {@const allOn = provPlans.every(p => p.isActive)}
    <div class="flex items-center justify-between border-b border-fanu-50 px-4 py-3 last:border-0">
      <div>
        <p class="text-sm font-semibold text-ink">{prov}</p>
        <p class="text-[11px] text-ink/40">{provPlans.filter(p => p.isActive).length}/{provPlans.length} packages active</p>
      </div>
      <button
        type="button"
        on:click={() => { adminToggleCableProvider(prov, !allOn); showToast(`${prov} ${allOn ? 'disabled' : 'enabled'}`); }}
        class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
        class:border-fanu-500={allOn} class:bg-fanu-50={allOn} class:text-fanu-700={allOn}
        class:border-fanu-100={!allOn} class:text-ink={!allOn}
      >{allOn ? 'Disable all' : 'Enable all'}</button>
    </div>
  {/each}
</div>

<!-- ── CABLE: INDIVIDUAL PLANS ── -->
<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Cable TV — individual packages</p>
<div class="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each providers as prov}
    <div class="border-b border-fanu-100 bg-fanu-50/40 px-4 py-2">
      <p class="text-xs font-bold text-ink/50">{prov}</p>
    </div>
    {#each $cablePlans.filter(p => p.provider === prov) as plan (plan.id)}
      <div class="flex items-center justify-between border-b border-fanu-50 px-4 py-2.5 last:border-0">
        <p class="text-sm font-medium text-ink" style={!plan.isActive ? "opacity:0.4" : ""}>{plan.packageName}</p>
        <div class="flex items-center gap-3">
          <span class="font-mono text-xs tabular-nums text-ink/60">{formatNaira(plan.price)}</span>
          <button
            type="button"
            role="switch"
            aria-checked={plan.isActive}
            on:click={() => { adminToggleCablePlan(plan.id, !plan.isActive); showToast(`${plan.packageName} ${plan.isActive ? 'disabled' : 'enabled'}`); }}
            class="relative h-5 w-9 rounded-full transition-colors"
            style={plan.isActive ? 'background:#1F7A34' : 'background:#d8d5cd'}
          >
            <span class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
              style={plan.isActive ? 'transform:translateX(17px)' : 'transform:translateX(2px)'}></span>
          </button>
        </div>
      </div>
    {/each}
  {/each}
</div>

<!-- ── AIRTIME: PER-NETWORK ── -->
<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Airtime — by network</p>
<div class="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each $airtimeSettings as setting (setting.network)}
    {@const net = NETWORKS.find(n => n.code === setting.network)}
    <div class="flex items-center justify-between border-b border-fanu-50 px-4 py-3 last:border-0">
      <div class="flex items-center gap-2.5">
        <span class="h-4 w-4 rounded-full" style="background:{net?.color ?? '#ccc'}"></span>
        <span class="text-sm font-semibold text-ink">{net?.label ?? setting.network}</span>
        <span class="text-[11px] text-ink/40">min {formatNaira(setting.minAmount)} · max {formatNaira(setting.maxAmount)}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={setting.isActive}
        on:click={() => { adminUpdateAirtimeSetting(setting.network, { isActive: !setting.isActive }); showToast(`${net?.label} airtime ${setting.isActive ? 'disabled' : 'enabled'}`); }}
        class="relative h-6 w-11 rounded-full transition-colors"
        style={setting.isActive ? 'background:#1F7A34' : 'background:#d8d5cd'}
      >
        <span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={setting.isActive ? 'transform:translateX(22px)' : 'transform:translateX(2px)'}></span>
      </button>
    </div>
  {/each}
</div>

<!-- ── ELECTRICITY: PER-DISCO ── -->
<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Electricity — by DisCo</p>
<div class="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each $discoSettings as disco (disco.code)}
    <div class="flex items-center justify-between border-b border-fanu-50 px-4 py-3 last:border-0">
      <div>
        <p class="text-sm font-semibold text-ink">{disco.label}</p>
        <p class="text-[11px] text-ink/40">Min {formatNaira(disco.minAmount)}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={disco.isActive}
        on:click={() => { adminUpdateDisco(disco.code, { isActive: !disco.isActive }); showToast(`${disco.label} ${disco.isActive ? 'disabled' : 'enabled'}`); }}
        class="relative h-6 w-11 rounded-full transition-colors"
        style={disco.isActive ? 'background:#1F7A34' : 'background:#d8d5cd'}
      >
        <span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={disco.isActive ? 'transform:translateX(22px)' : 'transform:translateX(2px)'}></span>
      </button>
    </div>
  {/each}
</div>

<!-- ── BULK SMS PACKAGES ── -->
<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Bulk SMS — packages</p>
<div class="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each $smsPackages as pkg (pkg.id)}
    <div class="flex items-center justify-between border-b border-fanu-50 px-4 py-2.5 last:border-0">
      <p class="text-sm font-medium text-ink" style={!pkg.isActive ? "opacity:0.4" : ""}>{pkg.units.toLocaleString()} units · {formatNaira(pkg.price)}</p>
      <button
        type="button"
        role="switch"
        aria-checked={pkg.isActive}
        on:click={() => { adminToggleSmsPackage(pkg.id, !pkg.isActive); showToast(`${pkg.units.toLocaleString()} unit package ${pkg.isActive ? 'disabled' : 'enabled'}`); }}
        class="relative h-5 w-9 rounded-full transition-colors"
        style={pkg.isActive ? 'background:#1F7A34' : 'background:#d8d5cd'}
      >
        <span class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
          style={pkg.isActive ? 'transform:translateX(17px)' : 'transform:translateX(2px)'}></span>
      </button>
    </div>
  {/each}
</div>

<!-- ── RESULT CHECKER PINS ── -->
<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Result checker — exam types</p>
<div class="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each $resultPins as pin (pin.id)}
    <div class="flex items-center justify-between border-b border-fanu-50 px-4 py-3 last:border-0">
      <div>
        <p class="text-sm font-semibold text-ink" style={!pin.isActive ? "opacity:0.4" : ""}>{pin.type}</p>
        <p class="text-[11px] text-ink/40">{formatNaira(pin.price)}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={pin.isActive}
        on:click={() => { adminToggleResultPin(pin.id, !pin.isActive); showToast(`${pin.type} ${pin.isActive ? 'disabled' : 'enabled'}`); }}
        class="relative h-6 w-11 rounded-full transition-colors"
        style={pin.isActive ? 'background:#1F7A34' : 'background:#d8d5cd'}
      >
        <span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={pin.isActive ? 'transform:translateX(22px)' : 'transform:translateX(2px)'}></span>
      </button>
    </div>
  {/each}
</div>

<!-- ── RECHARGE CARD DENOMINATIONS ── -->
<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Recharge cards — denominations</p>
<div class="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
  {#each $rechargeDenominations as denom (denom.value)}
    <div class="flex items-center justify-between border-b border-fanu-50 px-4 py-2.5 last:border-0">
      <p class="font-mono text-sm font-semibold tabular-nums text-ink" style={!denom.isActive ? "opacity:0.4" : ""}>{formatNaira(denom.value)}</p>
      <button
        type="button"
        role="switch"
        aria-checked={denom.isActive}
        on:click={() => { adminUpdateRechargeDenom(denom.value, !denom.isActive); showToast(`₦${denom.value.toLocaleString()} denomination ${denom.isActive ? 'disabled' : 'enabled'}`); }}
        class="relative h-5 w-9 rounded-full transition-colors"
        style={denom.isActive ? 'background:#1F7A34' : 'background:#d8d5cd'}
      >
        <span class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
          style={denom.isActive ? 'transform:translateX(17px)' : 'transform:translateX(2px)'}></span>
      </button>
    </div>
  {/each}
</div>
