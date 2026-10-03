<script lang="ts">
  import { onMount } from 'svelte';
  import { allTransactionsForAdmin, adminUpdateTransactionStatus, loadAllTransactionsForAdmin } from '$lib/stores/db';
  import TransactionDetailModal from '$lib/components/TransactionDetailModal.svelte';
  import { showToast } from '$lib/stores/toast';
  import { formatNaira, formatDate } from '$lib/format';
  import type { Transaction } from '$lib/types';

  type TxWithUser = Transaction & { userEmail: string; userName: string };
  let selectedTx: TxWithUser | null = null;
  onMount(() => loadAllTransactionsForAdmin());

  let search = '';
  let filterStatus: '' | Transaction['status'] = '';
  let filterType: string = '';
  let editingId: string | null = null;
  let editEmail = '';
  let editStatus: Transaction['status'] = 'success';
  let editNote = '';

  const statusColors: Record<Transaction['status'], string> = {
    success: 'bg-fanu-50 text-fanu-700',
    pending: 'bg-amber-50 text-amber-700',
    failed: 'bg-red-50 text-red-700'
  };

  const typeIcons: Record<string, string> = {
    wallet_funding: '💰', airtime: '📱', data: '📶', electricity: '💡', cable: '📺',
    airtime_to_cash: '🔄', recharge_card_printing: '🖨️', bulk_sms: '💬',
    result_checker: '📋', admin_adjustment: '🛠️'
  };

  $: filtered = ($allTransactionsForAdmin as TxWithUser[]).filter((tx) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q ||
      tx.userEmail.toLowerCase().includes(q) ||
      tx.userName.toLowerCase().includes(q) ||
      tx.reference.toLowerCase().includes(q) ||
      tx.description.toLowerCase().includes(q);
    const matchStatus = !filterStatus || tx.status === filterStatus;
    const matchType = !filterType || tx.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  $: totalAmount = filtered.reduce((s, tx) =>
    tx.type === 'wallet_funding' || tx.type === 'airtime_to_cash' ? s + tx.amount : s - tx.amount, 0
  );

  function startEdit(tx: TxWithUser) {
    editingId = tx.id;
    editEmail = tx.userEmail;
    editStatus = tx.status;
    editNote = tx.meta?.adminNote ?? '';
  }

  async function saveEdit() {
    if (!editingId) return;
    const result = await adminUpdateTransactionStatus(editingId, editStatus, editNote);
    if (!result.ok) return showToast(result.error, 'error');
    showToast('Transaction status updated');
    editingId = null;
    editNote = '';
  }

  let checkingId: string | null = null;
  async function checkWithProvider(id: string) {
    checkingId = id;
    try {
      const res = await fetch('/api/purchase/requery', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactionId: id })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) { showToast(data?.error ?? 'Could not check this order', 'error'); return; }
      if (!data.changed) { showToast(data.status === 'pending' ? 'Still pending at the provider' : `Already ${data.status}`); return; }
      showToast(data.status === 'success' ? 'Delivered — marked successful' : 'Failed at the provider — customer refunded');
      await loadAllTransactionsForAdmin();
    } catch { showToast('Network problem. Try again.', 'error'); }
    finally { checkingId = null; }
  }

  function setEditStatus(s: string) {
    editStatus = s as Transaction['status'];
  }

  const uniqueTypes = [...new Set(($allTransactionsForAdmin as TxWithUser[]).map((t) => t.type))];
</script>

<svelte:head><title>Transactions — Admin</title></svelte:head>

<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
  <h1 class="font-display text-xl font-bold text-ink">All Transactions</h1>
  <p class="font-mono text-sm font-semibold tabular-nums text-ink/60">
    {filtered.length} transactions
  </p>
</div>

<div class="mb-4 flex flex-wrap gap-2">
  <input
    type="search"
    bind:value={search}
    placeholder="Search by user, ref or description…"
    class="rounded-xl border border-fanu-100 bg-white px-3.5 py-2.5 text-sm focus:border-fanu-500"
    style="min-width:220px;flex:1"
  />
  <select bind:value={filterStatus} class="rounded-xl border border-fanu-100 bg-white px-3 py-2.5 text-sm focus:border-fanu-500">
    <option value="">All statuses</option>
    <option value="success">Success</option>
    <option value="pending">Pending</option>
    <option value="failed">Failed</option>
  </select>
  <select bind:value={filterType} class="rounded-xl border border-fanu-100 bg-white px-3 py-2.5 text-sm focus:border-fanu-500">
    <option value="">All types</option>
    {#each uniqueTypes as type}
      <option value={type}>{type.replace(/_/g, ' ')}</option>
    {/each}
  </select>
</div>

{#if filtered.length === 0}
  <div class="rounded-2xl bg-white px-4 py-12 text-center shadow-sm">
    <p class="text-2xl">🧾</p>
    <p class="mt-2 text-sm font-medium text-ink/60">No transactions match this filter</p>
  </div>
{:else}
  <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
    {#each filtered as tx (tx.id)}
      <div class="border-b border-fanu-50 last:border-0">
        <button type="button" class="w-full text-left" on:click={() => (selectedTx = tx)}>
          <div class="flex items-start gap-3 px-4 py-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fanu-50 text-base">
            {typeIcons[tx.type] ?? '🔹'}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-sm font-medium text-ink truncate">{tx.description}</p>
              <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize {statusColors[tx.status]}">
                {tx.status}
              </span>
            </div>
            <p class="text-[11px] text-ink/45 mt-0.5">
              {tx.userName || tx.userEmail} · {formatDate(tx.createdAt)} · <span class="font-mono">{tx.reference}</span>
            </p>
            {#if tx.meta?.adminNote}
              <p class="text-[10px] text-fanu-700 mt-0.5">Admin note: {tx.meta.adminNote}</p>
            {/if}
          </div>
          <div class="shrink-0 text-right">
            <p class="font-mono text-sm font-semibold tabular-nums"
              class:text-fanu-700={tx.type === 'wallet_funding' || tx.type === 'airtime_to_cash'}
              class:text-ink={tx.type !== 'wallet_funding' && tx.type !== 'airtime_to_cash'}
            >
              {tx.type === 'wallet_funding' || tx.type === 'airtime_to_cash' ? '+' : '-'}{formatNaira(tx.amount)}
            </p>
            <button
              type="button"
              on:click={() => startEdit(tx)}
              class="text-[11px] font-medium text-ink/40 hover:text-fanu-700 hover:underline"
            >
              Edit status
            </button>
            {#if tx.status === 'pending' && (tx.type === 'airtime' || tx.type === 'data')}
              <button
                type="button"
                on:click={() => checkWithProvider(tx.id)}
                disabled={checkingId === tx.id}
                class="mt-0.5 block w-full text-right text-[11px] font-semibold text-spark-600 hover:underline disabled:opacity-50"
              >
                {checkingId === tx.id ? 'Checking…' : 'Check with provider'}
              </button>
            {/if}
          </div>
        </div>

        </button>
        {#if editingId === tx.id}
          <div class="bg-fanu-50/60 px-4 py-3 border-t border-fanu-100">
            <p class="mb-2 text-xs font-semibold text-ink">Change transaction status</p>
            <div class="flex flex-wrap gap-2 mb-2">
              {#each ['success', 'pending', 'failed'] as s}
                <button
                  type="button"
                  on:click={() => setEditStatus(s)}
                  class="rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition"
                  class:border-fanu-500={editStatus === s}
                  class:bg-fanu-50={editStatus === s}
                  class:border-fanu-100={editStatus !== s}
                >
                  {s}
                </button>
              {/each}
            </div>
            <input
              type="text"
              bind:value={editNote}
              placeholder="Admin note (optional)"
              class="mb-2 w-full rounded-lg border border-fanu-100 bg-white px-3 py-2 text-xs focus:border-fanu-500"
            />
            <div class="flex gap-2">
              <button type="button" on:click={saveEdit} class="rounded-lg bg-fanu-600 px-4 py-2 text-xs font-semibold text-white hover:bg-fanu-700">
                Save
              </button>
              <button type="button" on:click={() => (editingId = null)} class="rounded-lg border border-fanu-100 px-4 py-2 text-xs font-semibold text-ink/60 hover:bg-fanu-50">
                Cancel
              </button>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<TransactionDetailModal tx={selectedTx} onClose={() => (selectedTx = null)} />
