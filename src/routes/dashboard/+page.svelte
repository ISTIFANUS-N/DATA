<script lang="ts">
  import { onMount } from 'svelte';
  import { currentProfile, walletBalance, transactions, myTodayLoginCount } from '$lib/stores/db';
  import { supabase } from '$lib/supabase';
  import WalletCard from '$lib/components/WalletCard.svelte';
  import FundWalletModal from '$lib/components/FundWalletModal.svelte';
  import TransactionRow from '$lib/components/TransactionRow.svelte';

  let fundModalOpen = false;
  let copied = false;
  let showAccountPrompt = false; // orange popup for users without an account

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

  <!-- Orange popup for users without an account -->
  {#if showAccountPrompt && accountLoaded && !reservedAccount}
    <div class="mt-3 flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3.5">
      <span class="mt-0.5 text-lg shrink-0">⚠️</span>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-bold text-orange-800">You don't have a funding account yet</p>
        <p class="text-xs text-orange-700 mt-0.5 leading-relaxed">
          Get a dedicated Moniepoint account number to fund your wallet instantly via bank transfer.
        </p>
        <button type="button" on:click={openFund}
          class="mt-2.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600">
          Get my account number
        </button>
      </div>
      <button type="button" on:click={() => (showAccountPrompt = false)}
        class="shrink-0 text-orange-400 hover:text-orange-600 text-lg leading-none">✕</button>
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
