<script lang="ts">
  import { onMount } from 'svelte';
  import { currentProfile, walletBalance, transactions, myTodayLoginCount } from '$lib/stores/db';
  import { supabase } from '$lib/supabase';
  import WalletCard from '$lib/components/WalletCard.svelte';
  import FundWalletModal from '$lib/components/FundWalletModal.svelte';
  import TransactionRow from '$lib/components/TransactionRow.svelte';
  import { dashboardNotice, welcomeSuggestion } from '$lib/stores/settings';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';

  let fundModalOpen = false;
  let copied = false;
  let showAccountPrompt = false; // friendly suggestion for users without an account

  // Remember which notification the user dismissed (keyed by its save time, so a new message shows again).
  let dismissedNotice = '';
  try { dismissedNotice = localStorage.getItem('stx_notice_dismissed') ?? ''; } catch {}
  function dismissNotice() {
    dismissedNotice = $dashboardNotice.updatedAt ?? 'x';
    try { localStorage.setItem('stx_notice_dismissed', dismissedNotice); } catch {}
  }
  const noticeTone = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    success: 'border-fanu-100 bg-fanu-50 text-fanu-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-900'
  } as const;
  $: showNotice = $dashboardNotice.enabled && $dashboardNotice.message.trim() !== ''
    && dismissedNotice !== ($dashboardNotice.updatedAt ?? 'x');

  type ReservedAccount = {
    account_number: string;
    account_name: string;
    bank_name: string;
    bvn_verified: boolean;
  };

  let reservedAccount: ReservedAccount | null = null;
  let accountLoaded = false;

  const services = [
    { href: '/buy-data',               label: 'Data',         icon: '📶' },
    { href: '/buy-airtime',            label: 'Airtime',      icon: '📱' },
    { href: '/tv-subscription',        label: 'Cable TV',     icon: '📺' },
    { href: '/electricity-bill',       label: 'Electricity',  icon: '💡' },
    { href: '/airtime-to-cash',        label: 'Airtime→Cash', icon: '🔄' },
    { href: '/recharge-card-printing', label: 'Recharge',     icon: '🖨️' },
    { href: '/bulk-sms',               label: 'Bulk SMS',     icon: '💬' },
    { href: '/result-checker',         label: 'Results',      icon: '📋' }
  ];

  $: recentTransactions = $transactions.slice(0, 5);
  $: firstName = $currentProfile?.fullName?.split(' ')[0] ?? '';
  $: pkg = $currentProfile?.package ?? 'smart_user';

  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('reserved_accounts')
      .select('account_number, account_name, bank_name, bvn_verified')
      .eq('user_id', user.id)
      .maybeSingle();

    reservedAccount = data;
    accountLoaded = true;

    // Show orange prompt if no account yet
    if (!data) showAccountPrompt = true;
  });

  async function copyAccount() {
    if (!reservedAccount?.account_number) return;
    await navigator.clipboard.writeText(reservedAccount.account_number);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  async function handleModalClose() {
    fundModalOpen = false;
    // Refresh account in case it was just created
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('reserved_accounts')
      .select('account_number, account_name, bank_name, bvn_verified')
      .eq('user_id', user.id)
      .maybeSingle();
    reservedAccount = data;
    if (data) showAccountPrompt = false;
  }

  function openFund() {
    showAccountPrompt = false;
    fundModalOpen = true;
  }
</script>

<svelte:head><title>Dashboard — Stefanx</title></svelte:head>

<div class="px-4 pt-6 pb-8">

  <!-- Greeting -->
  <div class="mb-4 flex items-center justify-between">
    <div class="flex items-center gap-2.5">
      <img src="/stefanx-icon.png" alt="" class="h-8 w-8 rounded-lg" />
      <div>
        <p class="text-xs text-ink/50">Welcome back</p>
        <p class="font-display text-lg font-semibold text-ink">{firstName || 'there'}</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <ThemeToggle />
      {#if $myTodayLoginCount > 1}
        <span class="rounded-full bg-fanu-50 px-2.5 py-1 text-[11px] font-medium text-fanu-700">
          {$myTodayLoginCount}× today
        </span>
      {/if}
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-fanu-100 font-display text-sm font-semibold text-fanu-700">
        {firstName ? firstName[0].toUpperCase() : '?'}
      </div>
    </div>
  </div>

  <!-- Admin notification bar -->
  {#if showNotice}
    <div class="mb-3 flex items-start gap-3 rounded-2xl border px-4 py-3 {noticeTone[$dashboardNotice.tone]}">
      <span class="mt-0.5 shrink-0 text-base">📢</span>
      <p class="min-w-0 flex-1 whitespace-pre-line text-xs leading-relaxed">{$dashboardNotice.message}</p>
      <button type="button" on:click={dismissNotice} aria-label="Dismiss"
        class="shrink-0 text-lg leading-none opacity-50 hover:opacity-100">✕</button>
    </div>
  {/if}

  <!-- Wallet card with inline account number -->
  <WalletCard
    balance={$walletBalance}
    package_={pkg}
    accountNumber={reservedAccount?.account_number ?? ''}
    accountName={reservedAccount?.account_name ?? ''}
    bankName={reservedAccount?.bank_name ?? ''}
    onFund={openFund}
    onCopy={copyAccount}
    {copied}
  />

  <!-- Gentle suggestion for users without a funding account (text managed by admins) -->
  {#if showAccountPrompt && accountLoaded && !reservedAccount && $welcomeSuggestion.enabled}
    <div class="mt-3 flex items-start gap-3 rounded-2xl border border-fanu-100 bg-fanu-50 px-4 py-3.5">
      <span class="mt-0.5 shrink-0 text-lg">💡</span>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-fanu-700">{$welcomeSuggestion.title}</p>
        <p class="mt-0.5 text-xs leading-relaxed text-ink/60">{$welcomeSuggestion.message}</p>
        <button type="button" on:click={openFund}
          class="mt-2.5 rounded-xl bg-fanu-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-fanu-700">
          Get my account number
        </button>
      </div>
      <button type="button" on:click={() => (showAccountPrompt = false)} aria-label="Dismiss"
        class="shrink-0 text-lg leading-none text-ink/30 hover:text-ink/60">✕</button>
    </div>
  {/if}

  <!-- Services grid -->
  <div class="mt-6">
    <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/45">Services</p>
    <div class="grid grid-cols-4 gap-3">
      {#each services as service}
        <a href={service.href}
          class="flex flex-col items-center gap-1.5 rounded-2xl bg-white py-3 text-center shadow-sm transition hover:shadow-md active:scale-95">
          <span class="text-2xl">{service.icon}</span>
          <span class="text-[11px] font-medium leading-tight text-ink/80">{service.label}</span>
        </a>
      {/each}
    </div>
  </div>

  <!-- Recent transactions -->
  <div class="mt-6">
    <div class="mb-3 flex items-center justify-between">
      <p class="text-xs font-semibold uppercase tracking-wide text-ink/45">Recent transactions</p>
      {#if $transactions.length > 0}
        <a href="/transaction-history" class="text-xs font-medium text-spark-600">See all</a>
      {/if}
    </div>
    <div class="rounded-2xl bg-white px-4 shadow-sm">
      {#if recentTransactions.length === 0}
        <div class="py-10 text-center">
          <p class="text-2xl">🧾</p>
          <p class="mt-2 text-sm font-medium text-ink/70">No transactions yet</p>
          <p class="text-xs text-ink/40">Fund your wallet and make a purchase</p>
        </div>
      {:else}
        {#each recentTransactions as tx (tx.id)}
          <TransactionRow {tx} />
        {/each}
      {/if}
    </div>
  </div>
</div>

<FundWalletModal bind:open={fundModalOpen} onClose={handleModalClose} />
