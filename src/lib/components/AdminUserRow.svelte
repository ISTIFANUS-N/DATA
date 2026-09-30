<script lang="ts">
  import type { AdminUserRow } from '$lib/stores/db';
  import { adminUpdateProfile, adminSetUserPassword, adminDeleteUser, adminAdjustWallet, adminUpdateTransactionStatus } from '$lib/stores/db';
  import { stageApproval } from '$lib/stores/approvals';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira, formatDate } from '$lib/format';
  import type { Transaction } from '$lib/types';

  export let row: AdminUserRow;
  export let isSelf: boolean;

  type TabId = 'profile' | 'password' | 'wallet' | 'transactions' | 'delete';

  let expanded = false;
  let tab: TabId = 'profile';
  let userTransactions: import('$lib/types').Transaction[] = [];
  let loadingTxs = false;

  async function loadUserTransactions() {
    if (userTransactions.length > 0) return;
    loadingTxs = true;
    const { supabase } = await import('$lib/supabase');
    const { data } = await supabase
      .from('service_transactions')
      .select('id, service_type, status, amount, reference, description, created_at')
      .eq('user_id', row.profile.id)
      .order('created_at', { ascending: false })
      .limit(20);
    userTransactions = (data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id), type: r.service_type as import('$lib/types').TransactionType,
      status: r.status as import('$lib/types').TransactionStatus,
      amount: Number(r.amount), reference: String(r.reference ?? ''),
      description: String(r.description ?? ''), createdAt: String(r.created_at)
    }));
    loadingTxs = false;
  }
  const tabs: { id: TabId; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Password' },
    { id: 'wallet', label: 'Wallet' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'delete', label: 'Delete' }
  ];

  // Transaction status editing within the row
  let editingTxId: string | null = null;
  let editTxStatus: Transaction['status'] = 'success';
  let editTxNote = '';

  const statusColors: Record<string, string> = {
    success: 'bg-fanu-50 text-fanu-700',
    pending: 'bg-amber-50 text-amber-700',
    failed: 'bg-red-50 text-red-700'
  };

  const typeIcons: Record<string, string> = {
    wallet_funding: '💰', airtime: '📱', data: '📶', electricity: '💡', cable: '📺',
    airtime_to_cash: '🔄', recharge_card_printing: '🖨️', bulk_sms: '💬',
    result_checker: '📋', admin_adjustment: '🛠️'
  };

  function startEditTx(tx: Transaction & { userEmail?: string; userName?: string }) {
    editingTxId = tx.id;
    editTxStatus = tx.status;
    editTxNote = (tx.meta?.adminNote as string) ?? '';
  }

  function setTxStatus(s: string) { editTxStatus = s as typeof editTxStatus; }

  async function saveTxStatus() {
    if (!editingTxId) return;
    const result = await adminUpdateTransactionStatus(editingTxId, editTxStatus, editTxNote);
    if (!result.ok) return showToast(result.error, 'error');
    showToast('Transaction status updated');
    editingTxId = null;
    editTxNote = '';
  }

  let fullName = row.profile.fullName;
  let phone = row.profile.phone;
  let pkg = row.profile.package;
  let role = row.profile.role;

  let newPassword = '';
  let walletDirection: 'credit' | 'debit' = 'credit';
  let walletAmount: number | null = null;
  let walletNote = '';

  function toggle() {
    expanded = !expanded;
    if (expanded) {
      fullName = row.profile.fullName;
      phone = row.profile.phone;
      pkg = row.profile.package;
      role = row.profile.role;
      tab = 'profile';
    }
  }

  async function saveProfile() {
    // Password changes, name, phone → apply immediately (no money or access impact)
    const immediateUpdates = { fullName, phone };
    const immediateResult = await adminUpdateProfile(row.profile.id, immediateUpdates);
    if (!immediateResult.ok) return showToast(immediateResult.error, 'error');

    // Role or package changes → stage for super admin approval
    const roleChanged = role !== row.profile.role || pkg !== row.profile.package;
    if (roleChanged) {
      const staged = await stageApproval(
        'change_user_role',
        { targetEmail: row.email, updates: { role, package: pkg } },
        `Admin requested role/package change for ${row.email}`
      );
      if (staged.staged) {
        showToast('Name/phone saved. Role/package change staged for super admin approval');
        return;
      }
      // Super admin — apply immediately
      const roleResult = await adminUpdateProfile(row.profile.id, { role, package: pkg as 'smart_user' | 'reseller' });
      if (!roleResult.ok) return showToast(roleResult.error, 'error');
    }

    showToast('Profile updated');
  }

  async function setPassword() {
    const result = await adminSetUserPassword(row.profile.id, newPassword);
    if (!result.ok) return showToast(result.error, 'error');
    newPassword = '';
    showToast('Password updated');
  }

  async function adjustWallet() {
    if (!walletAmount || walletAmount <= 0) return showToast('Enter an amount above ₦0', 'error');

    const staged = await stageApproval(
      walletDirection === 'credit' ? 'admin_wallet_credit' : 'admin_wallet_debit',
      { targetEmail: row.email, amount: walletAmount, direction: walletDirection, note: walletNote }
    );

    if (staged.staged) {
      showToast('Wallet adjustment staged for super admin approval');
      walletAmount = null;
      walletNote = '';
      return;
    }

    // Super admin — apply immediately
    const result = await adminAdjustWallet(row.profile.id, walletAmount, walletDirection, walletNote);
    if (!result.ok) return showToast(result.error, 'error');
    showToast(`${walletDirection === 'credit' ? 'Credited' : 'Debited'} ${formatNaira(walletAmount)}`);
    walletAmount = null;
    walletNote = '';
  }

  async function deleteUser() {
    const staged = await stageApproval('delete_user', { targetUserId: row.profile.id, targetEmail: row.email, name: row.profile.fullName || row.email });

    if (staged.staged) {
      showToast('Account deletion staged for super admin approval');
      return;
    }

    // Super admin — apply immediately
    const result = await adminDeleteUser(row.profile.id);
    if (!result.ok) return showToast(result.error, 'error');
    showToast('User deleted');
  }
</script>

<div class="border-b border-fanu-50 last:border-0">
  <button
    type="button"
    on:click={toggle}
    class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
  >
    <div class="min-w-0">
      <p class="truncate text-sm font-medium text-ink">
        {row.profile.fullName || 'Unnamed user'}
        {#if isSelf}<span class="text-[10px] text-ink/35">(you)</span>{/if}
      </p>
      <p class="truncate text-[11px] text-ink/45">{row.email} · {row.profile.phone || 'no phone'}</p>
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <span class="rounded-full bg-fanu-50 px-2 py-0.5 text-[10px] font-medium capitalize text-fanu-700">
        {row.profile.package === 'reseller' ? 'Reseller' : 'Smart User'}
      </span>
      {#if row.profile.role === 'admin'}
        <span class="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-medium text-ink">Admin</span>
      {/if}
      <span class="font-mono text-xs font-semibold tabular-nums text-ink/70">{formatNaira(row.walletBalance)}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-ink/30 transition-transform" style={expanded ? 'transform:rotate(180deg)' : ''}>
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  </button>

  {#if expanded}
    <div class="bg-fanu-50/40 px-4 pb-4">
      <div class="mb-3 flex gap-1 border-b border-fanu-100">
        {#each tabs as t (t.id)}
          <button
            type="button"
            on:click={() => (tab = t.id)}
            class="px-3 py-2 text-xs font-medium transition"
            class:text-fanu-700={tab === t.id}
            class:border-b-2={tab === t.id}
            class:border-fanu-600={tab === t.id}
            class:text-ink={tab !== t.id}
          >
            {t.label}
          </button>
        {/each}
      </div>

      {#if tab === 'profile'}
        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1 text-xs">
            <span class="font-medium text-ink/60">Full name</span>
            <input type="text" bind:value={fullName} class="rounded-lg border border-fanu-100 bg-white px-2.5 py-2 text-sm" />
          </label>
          <label class="flex flex-col gap-1 text-xs">
            <span class="font-medium text-ink/60">Phone</span>
            <input type="text" bind:value={phone} class="rounded-lg border border-fanu-100 bg-white px-2.5 py-2 text-sm" />
          </label>
          <label class="flex flex-col gap-1 text-xs">
            <span class="font-medium text-ink/60">Package</span>
            <select bind:value={pkg} class="rounded-lg border border-fanu-100 bg-white px-2.5 py-2 text-sm">
              <option value="smart_user">Smart User</option>
              <option value="reseller">Reseller</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-xs">
            <span class="font-medium text-ink/60">Role</span>
            <select bind:value={role} class="rounded-lg border border-fanu-100 bg-white px-2.5 py-2 text-sm">
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        <button type="button" on:click={saveProfile} class="mt-3 rounded-lg bg-fanu-600 px-4 py-2 text-xs font-semibold text-white hover:bg-fanu-700">
          Save changes
        </button>
      {:else if tab === 'password'}
        <label class="mb-3 flex max-w-xs flex-col gap-1 text-xs">
          <span class="font-medium text-ink/60">New password</span>
          <input type="text" bind:value={newPassword} placeholder="At least 6 characters" class="rounded-lg border border-fanu-100 bg-white px-2.5 py-2 text-sm" />
        </label>
        <button type="button" on:click={setPassword} class="rounded-lg bg-fanu-600 px-4 py-2 text-xs font-semibold text-white hover:bg-fanu-700">
          Set password
        </button>
      {:else if tab === 'wallet'}
        <div class="mb-3 flex gap-2">
          <button
            type="button"
            on:click={() => (walletDirection = 'credit')}
            class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
            class:border-fanu-500={walletDirection === 'credit'}
            class:bg-fanu-50={walletDirection === 'credit'}
            class:border-fanu-100={walletDirection !== 'credit'}
          >
            Credit
          </button>
          <button
            type="button"
            on:click={() => (walletDirection = 'debit')}
            class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
            class:border-red-400={walletDirection === 'debit'}
            class:bg-red-50={walletDirection === 'debit'}
            class:border-fanu-100={walletDirection !== 'debit'}
          >
            Debit
          </button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1 text-xs">
            <span class="font-medium text-ink/60">Amount (₦)</span>
            <input type="number" min="0" bind:value={walletAmount} class="rounded-lg border border-fanu-100 bg-white px-2.5 py-2 text-sm" />
          </label>
          <label class="flex flex-col gap-1 text-xs">
            <span class="font-medium text-ink/60">Note (optional)</span>
            <input type="text" bind:value={walletNote} placeholder="Reason for adjustment" class="rounded-lg border border-fanu-100 bg-white px-2.5 py-2 text-sm" />
          </label>
        </div>
        <p class="mt-2 text-[11px] text-ink/40">Current balance: {formatNaira(row.walletBalance)}</p>
        <button type="button" on:click={adjustWallet} class="mt-2 rounded-lg bg-fanu-600 px-4 py-2 text-xs font-semibold text-white hover:bg-fanu-700">
          Apply {walletDirection}
        </button>
      {:else if tab === 'transactions'}
        {#if userTransactions.length === 0}
          <p class="py-4 text-center text-xs text-ink/40">No transactions yet</p>
        {:else}
          <div class="max-h-64 overflow-y-auto -mx-4 px-4">
            {#each userTransactions as tx (tx.id)}
              <div class="border-b border-fanu-50 last:border-0">
                <div class="flex items-center gap-2 py-2">
                  <span class="text-sm">{typeIcons[tx.type] ?? '🔹'}</span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-xs font-medium text-ink">{tx.description}</p>
                    <p class="text-[10px] text-ink/45">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div class="shrink-0 text-right">
                    <p class="font-mono text-xs font-semibold tabular-nums text-ink">{formatNaira(tx.amount)}</p>
                    <span class="text-[9px] font-medium rounded-full px-1.5 py-0.5 {statusColors[tx.status]}">{tx.status}</span>
                  </div>
                  <button
                    type="button"
                    on:click={() => startEditTx(tx)}
                    class="ml-1 shrink-0 text-[10px] text-ink/35 hover:text-fanu-700"
                  >Edit</button>
                </div>
                {#if editingTxId === tx.id}
                  <div class="bg-fanu-50/60 rounded-lg px-3 py-2 mb-2">
                    <div class="flex gap-1.5 mb-1.5">
                      {#each ['success', 'pending', 'failed'] as s}
                        <button
                          type="button"
                          on:click={() => setTxStatus(s)}
                          class="rounded border px-2 py-1 text-[10px] font-semibold capitalize transition"
                          class:border-fanu-500={editTxStatus === s}
                          class:bg-fanu-50={editTxStatus === s}
                          class:border-fanu-100={editTxStatus !== s}
                        >{s}</button>
                      {/each}
                    </div>
                    <input type="text" bind:value={editTxNote} placeholder="Admin note" class="mb-1.5 w-full rounded border border-fanu-100 bg-white px-2 py-1 text-[10px]" />
                    <div class="flex gap-1.5">
                      <button type="button" on:click={saveTxStatus} class="rounded bg-fanu-600 px-3 py-1 text-[10px] font-semibold text-white">Save</button>
                      <button type="button" on:click={() => (editingTxId = null)} class="rounded border border-fanu-100 px-3 py-1 text-[10px] text-ink/60">Cancel</button>
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
          <a href="/admin/transactions" class="mt-2 block text-center text-xs font-medium text-fanu-700 hover:underline">
            View all in Transactions →
          </a>
        {/if}
      {:else if tab === 'delete'}
        {#if isSelf}
          <p class="text-xs text-ink/50">You can't delete your own account while signed in as it.</p>
        {:else}
          <p class="mb-3 text-xs text-ink/60">
            This will stage a deletion request for super admin approval. Once approved, {row.profile.fullName || row.email}'s account, wallet, and transaction history will be permanently removed.
          </p>
          <button type="button" on:click={deleteUser} class="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700">
            Request deletion
          </button>
        {/if}
      {/if}
    </div>
  {/if}
</div>
