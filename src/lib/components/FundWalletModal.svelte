<script lang="ts">
  import { reloadWallet, currentProfile } from '$lib/stores/db';
  import { supabase } from '$lib/supabase';
  import { showToast } from '$lib/stores/toast';

  export let open = false;
  export let onClose: () => void;

  type ReservedAccount = {
    account_number: string;
    account_name: string;
    bank_name: string;
    bank_code: string;
    bvn_verified: boolean;
  };

  let step: 'loading' | 'bvn' | 'account' | 'setup_required' = 'loading';
  let account: ReservedAccount | null = null;
  let bvn = '';
  let bvnError = '';
  let bvnLoading = false;
  let copied = false;
  let creatingAccount = false;

  function close() {
    open = false;
    step = 'loading';
    account = null;
    bvn = '';
    bvnError = '';
    onClose();
  }

  $: if (open) { loadAccount(); }

  async function loadAccount() {
    step = 'loading';
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { showToast('Not signed in', 'error'); close(); return; }

    // Check if account already exists in DB
    const { data: existing } = await supabase
      .from('reserved_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      account = existing;
      step = 'account';
      return;
    }

    // No account yet — Monnify requires a BVN to create one.
    step = 'bvn';
  }

  async function submitBvn() {
    bvnError = '';
    if (!/^\d{11}$/.test(bvn)) {
      bvnError = 'Enter a valid 11-digit BVN.'; return;
    }
    bvnLoading = true;
    try {
      const res = await fetch('/api/reserved-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bvn })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        bvnError = data?.error ?? 'Could not create your account. Try again.';
        return;
      }
      account = data.account;
      bvn = '';
      showToast('Account created ✓');
      step = 'account';
    } catch {
      bvnError = 'Network error. Check your connection and try again.';
    } finally {
      bvnLoading = false;
    }
  }

  async function copyAccountNumber() {
    if (!account?.account_number) return;
    await navigator.clipboard.writeText(account.account_number);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-end justify-center md:items-center">
    <div class="fixed inset-0 bg-ink/40 backdrop-blur-sm" on:click={close}></div>
    <div class="relative z-10 w-full max-w-sm rounded-t-3xl bg-white p-5 pb-10 shadow-2xl md:rounded-3xl md:pb-5">

      <div class="mb-4 flex items-center justify-between">
        <p class="font-display text-base font-bold text-ink">Fund wallet</p>
        <button type="button" on:click={close} class="text-sm text-ink/40 hover:text-ink">✕</button>
      </div>

      <!-- LOADING -->
      {#if step === 'loading'}
        <div class="flex flex-col items-center py-10 gap-3">
          <span class="h-8 w-8 animate-spin rounded-full border-4 border-fanu-100 border-t-fanu-600"></span>
          <p class="text-sm text-ink/60">{creatingAccount ? 'Creating your account…' : 'Loading…'}</p>
        </div>

      <!-- SETUP REQUIRED -->
      {:else if step === 'setup_required'}
        <div class="py-6 text-center">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
            <span class="text-2xl">⚙️</span>
          </div>
          <p class="font-semibold text-ink mb-2">Account setup in progress</p>
          <p class="text-sm text-ink/55 leading-relaxed mb-5">
            Your dedicated funding account is being configured. This is a one-time setup. Please contact support if this persists.
          </p>
          <p class="text-xs text-ink/40 mb-5">
            Contact: <a href="mailto:stefansservice@gmail.com" class="text-fanu-700 hover:underline">stefansservice@gmail.com</a>
          </p>
          <button type="button" on:click={loadAccount}
            class="w-full rounded-xl bg-fanu-600 py-3 text-sm font-semibold text-white hover:bg-fanu-700">
            Try again
          </button>
        </div>

      <!-- BVN STEP -->
      {:else if step === 'bvn'}
        <div class="mb-5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3.5">
          <p class="text-xs font-bold text-amber-800 mb-1">CBN requirement</p>
          <p class="text-xs text-amber-700 leading-relaxed">
            Your BVN must be linked before you can receive transfers. Your BVN is used for identity verification only.
          </p>
        </div>

        <label class="mb-1 block text-xs font-semibold text-ink/60">Bank Verification Number (BVN)</label>
        <input type="tel" bind:value={bvn} maxlength="11" placeholder="Enter your 11-digit BVN"
          class="mb-1 w-full rounded-xl border border-fanu-100 px-3.5 py-3 text-sm focus:border-fanu-500 focus:outline-none" />
        <p class="mb-4 text-[11px] text-ink/40">Dial <strong>*565*0#</strong> on your phone to get your BVN.</p>

        {#if bvnError}
          <p class="mb-3 text-sm text-red-600">{bvnError}</p>
        {/if}

        <button type="button" on:click={submitBvn} disabled={bvnLoading}
          class="mb-2.5 w-full rounded-xl bg-fanu-600 py-3.5 text-sm font-semibold text-white transition hover:bg-fanu-700 disabled:opacity-60">
          {bvnLoading ? 'Creating your account…' : 'Create my account'}
        </button>

      <!-- ACCOUNT DETAILS -->
      {:else if step === 'account' && account}
        <p class="mb-3 text-xs text-ink/55 leading-relaxed">
          Transfer to your dedicated Moniepoint account below. Your wallet credits automatically within seconds.
        </p>

        <!-- Account card -->
        <div class="mb-4 overflow-hidden rounded-2xl border border-fanu-100">
          <div class="bg-fanu-600 px-4 py-2.5">
            <p class="text-[11px] font-semibold text-white/70">Your Moniepoint account</p>
            <p class="text-[10px] text-white/50">Powered by Monnify</p>
          </div>
          <div class="bg-fanu-50 px-4 py-4">
            <p class="text-[11px] text-ink/45 mb-1">Account number</p>
            <div class="flex items-center gap-3 mb-3">
              <p class="font-mono text-2xl font-bold tracking-wider text-ink">{account.account_number}</p>
              <button type="button" on:click={copyAccountNumber}
                class="shrink-0 rounded-lg bg-white border border-fanu-100 px-3 py-1.5 text-xs font-semibold text-fanu-700 transition hover:bg-fanu-50">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p class="text-ink/45 mb-0.5">Bank</p>
                <p class="font-semibold text-ink">{account.bank_name}</p>
              </div>
              <div>
                <p class="text-ink/45 mb-0.5">Account name</p>
                <p class="font-semibold text-ink">{account.account_name}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-xl bg-white border border-fanu-100 px-3.5 py-3 text-xs text-ink/55 space-y-1.5 mb-4">
          <div class="flex gap-1.5"><span class="text-fanu-600">✓</span> Minimum: ₦100</div>
          <div class="flex gap-1.5"><span class="text-fanu-600">✓</span> Wallet credited within 30 seconds</div>
          <div class="flex gap-1.5"><span class="text-fanu-600">✓</span> This account number is permanent</div>
          <div class="flex gap-1.5"><span class="text-fanu-600">✓</span> Works 24/7 including weekends</div>
        </div>

        <button type="button" on:click={close}
          class="w-full rounded-xl bg-fanu-600 py-3 text-sm font-semibold text-white transition hover:bg-fanu-700">
          Done
        </button>
      {/if}
    </div>
  </div>
{/if}
