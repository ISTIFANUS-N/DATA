<script lang="ts">
  import { allAccountsForAdmin, allTransactionsForAdmin, todayLoginCount, loadAllAccountsForAdmin, loadAllTransactionsForAdmin, loadTodayLoginCount } from '$lib/stores/db';
  import { onMount } from 'svelte';
  onMount(() => { loadAllAccountsForAdmin(); loadAllTransactionsForAdmin(); loadTodayLoginCount(); });
  import { dataPlans, cablePlans } from '$lib/stores/catalog';
  import { apiBalance, isApiBalanceLow, refreshApiBalance, API_BALANCE_THRESHOLD } from '$lib/stores/apiBalance';
  import { formatNaira, formatDate } from '$lib/format';
  import { showToast } from '$lib/stores/toast';
  import { currentProfile } from '$lib/stores/db';

  $: isSuperAdmin = $currentProfile?.role === 'admin' && $currentProfile?.package === 'reseller';

  $: totalUsers = $allAccountsForAdmin.length;
  $: totalWalletBalance = $allAccountsForAdmin.reduce((sum, a) => sum + a.walletBalance, 0);
  $: totalTransactions = ($allTransactionsForAdmin as unknown[]).length;
  $: resellerCount = $allAccountsForAdmin.filter((a) => a.profile.package === 'reseller').length;
  $: recentTransactions = ($allTransactionsForAdmin as any[]).slice(0, 8);
</script>

<svelte:head><title>Admin overview — Stefanx</title></svelte:head>

<h1 class="mb-6 font-display text-xl font-bold text-ink">Overview</h1>

<div class="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
  <div class="rounded-2xl bg-white p-4 shadow-sm">
    <p class="text-[11px] font-medium text-ink/45">Total Users</p>
    <p class="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">{totalUsers}</p>
  </div>
  <div class="rounded-2xl bg-white p-4 shadow-sm">
    <p class="text-[11px] font-medium text-ink/45">Total Wallet Balance</p>
    <p class="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">{formatNaira(totalWalletBalance)}</p>
  </div>
  <div class="rounded-2xl bg-white p-4 shadow-sm">
    <p class="text-[11px] font-medium text-ink/45">Total Transactions</p>
    <p class="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">{totalTransactions}</p>
  </div>
  <div class="rounded-2xl bg-white p-4 shadow-sm">
    <p class="text-[11px] font-medium text-ink/45">Reseller Accounts</p>
    <p class="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">{resellerCount}</p>
  </div>
  <div class="rounded-2xl bg-white p-4 shadow-sm">
    <p class="text-[11px] font-medium text-ink/45">Logins today</p>
    <p class="mt-1 font-mono text-xl font-semibold tabular-nums text-fanu-700">{$todayLoginCount}</p>
  </div>
</div>

<div class="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
  <div class="flex items-center justify-between border-b border-fanu-50 px-4 py-3">
    <div>
      <p class="text-sm font-semibold text-ink">VTU Provider API Balance</p>
      <p class="text-[11px] text-ink/45">{$apiBalance.provider} · Last checked {new Date($apiBalance.lastChecked).toLocaleString('en-NG')}</p>
    </div>
    <button type="button" on:click={refreshApiBalance} class="text-xs font-medium text-fanu-700 hover:underline">Refresh</button>
  </div>
  <div class="flex items-center gap-4 px-4 py-3">
    <div>
      <p class="text-[11px] text-ink/45">Current balance</p>
      <p class="font-mono text-2xl font-semibold tabular-nums"
        class:text-fanu-700={!$isApiBalanceLow}
        class:text-amber-700={$isApiBalanceLow}
      >
        {formatNaira($apiBalance.balance)}
      </p>
    </div>
    {#if $isApiBalanceLow}
      <span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        ⚠ Low — top up now
      </span>
    {:else}
      <span class="rounded-full bg-fanu-50 px-3 py-1 text-xs font-semibold text-fanu-700">
        ✓ Healthy
      </span>
    {/if}
  </div>
  <div class="border-t border-fanu-50 px-4 py-3">
    <p class="mb-2 text-[11px] font-medium text-ink/45">Simulate balance (demo)</p>
    <div class="flex gap-2">
    </div>
    <p class="mt-1.5 text-[10px] text-ink/35">Alert fires when balance drops below {formatNaira(API_BALANCE_THRESHOLD)}</p>
  </div>
</div>

<div class="mb-6 grid gap-3 md:grid-cols-4">
  {#if isSuperAdmin}
  <a href="/admin/analytics" class="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
    <p class="text-sm font-semibold text-ink">📊 Analytics</p>
    <p class="mt-1 text-xs text-ink/45">Sales charts, top users, failure rates</p>
  </a>
  {/if}
  <a href="/admin/service-status" class="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
    <p class="text-sm font-semibold text-ink">🔀 Service status</p>
    <p class="mt-1 text-xs text-ink/45">Enable/disable services, networks, plan types</p>
  </a>
  <a href="/admin/transactions" class="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
    <p class="text-sm font-semibold text-ink">🧾 Transactions</p>
    <p class="mt-1 text-xs text-ink/45">{totalTransactions} total · view and edit status</p>
  </a>
  <a href="/admin/users" class="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
    <p class="text-sm font-semibold text-ink">👥 Users</p>
    <p class="mt-1 text-xs text-ink/45">{totalUsers} accounts · wallets, roles, passwords</p>
  </a>
  {#if isSuperAdmin}
  <a href="/admin/approvals" class="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
    <p class="text-sm font-semibold text-ink">✅ Approvals</p>
    <p class="mt-1 text-xs text-ink/45">Changes pending super admin review</p>
  </a>
  {/if}
  <a href="/admin/data-plans" class="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
    <p class="text-sm font-semibold text-ink">📶 Data plans</p>
    <p class="mt-1 text-xs text-ink/45">{$dataPlans.length} plans · add, edit, delete</p>
  </a>
  <a href="/admin/cable-plans" class="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
    <p class="text-sm font-semibold text-ink">📺 Cable plans</p>
    <p class="mt-1 text-xs text-ink/45">{$cablePlans.length} packages · DSTV/GOtv/StarTimes</p>
  </a>
  <a href="/admin/airtime" class="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
    <p class="text-sm font-semibold text-ink">📱 Airtime</p>
    <p class="mt-1 text-xs text-ink/45">Per-network limits and activation</p>
  </a>
  <a href="/admin/electricity" class="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
    <p class="text-sm font-semibold text-ink">💡 Electricity</p>
    <p class="mt-1 text-xs text-ink/45">DisCos — labels and min amounts</p>
  </a>
  <a href="/admin/bulk-sms" class="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
    <p class="text-sm font-semibold text-ink">💬 Bulk SMS</p>
    <p class="mt-1 text-xs text-ink/45">SMS packages and pricing</p>
  </a>
  <a href="/admin/result-checker" class="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
    <p class="text-sm font-semibold text-ink">📋 Result checker</p>
    <p class="mt-1 text-xs text-ink/45">WAEC, NECO, NABTEB, JAMB pin prices</p>
  </a>
  <a href="/admin/recharge-cards" class="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
    <p class="text-sm font-semibold text-ink">🖨️ Recharge cards</p>
    <p class="mt-1 text-xs text-ink/45">Card denominations and availability</p>
  </a>
  {#if isSuperAdmin}
  <a href="/admin/api-management" class="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
    <p class="text-sm font-semibold text-ink">⚙️ API management</p>
    <p class="mt-1 text-xs text-ink/45">VTU provider keys · super admin only</p>
  </a>
  {/if}
</div>

{#if recentTransactions.length > 0}
  <div class="mt-6">
    <div class="mb-3 flex items-center justify-between">
      <p class="text-sm font-semibold text-ink">Recent transactions</p>
      <a href="/admin/transactions" class="text-xs font-medium text-fanu-700 hover:underline">See all</a>
    </div>
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
      {#each recentTransactions as tx}
        <div class="flex items-center gap-3 border-b border-fanu-50 px-4 py-3 last:border-0">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-ink">{tx.description}</p>
            <p class="text-[11px] text-ink/45">{tx.userName || tx.userEmail} · {formatDate(tx.createdAt)}</p>
          </div>
          <div class="shrink-0 text-right">
            <p class="font-mono text-sm font-semibold tabular-nums text-ink">{formatNaira(tx.amount)}</p>
            <span class="text-[10px] font-medium capitalize" class:text-fanu-700={tx.status === 'success'} class:text-amber-700={tx.status === 'pending'} class:text-red-600={tx.status === 'failed'}>{tx.status}</span>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
