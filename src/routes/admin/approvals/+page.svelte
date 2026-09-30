<script lang="ts">
  import { onMount } from 'svelte';
  import { pendingApprovals, approvalQueue, loadApprovalQueue, approveChange, rejectChange } from '$lib/stores/approvals';
  onMount(() => loadApprovalQueue());
  import { currentProfile } from '$lib/stores/db';
  import { showToast } from '$lib/stores/toast';
  import { formatDate } from '$lib/format';

  $: isSuperAdmin = $currentProfile?.role === 'admin' && $currentProfile?.package === 'reseller';

  let rejectNote = '';
  let rejectingId: string | null = null;

  async function handleApprove(id: string) {
    const result = await approveChange(id);
    if (!result.ok) return showToast(result.error, 'error');
    showToast('Change approved and applied');
  }

  async function handleReject(id: string) {
    const result = await rejectChange(id, rejectNote || undefined);
    if (!result.ok) return showToast(result.error, 'error');
    rejectNote = '';
    rejectingId = null;
    showToast('Change rejected');
  }

  const actionLabels: Record<string, string> = {
    update_data_plan_price: 'Update data plan price',
    add_data_plan: 'Add data plan',
    delete_data_plan: 'Delete data plan',
    update_cable_plan_price: 'Update cable plan price',
    add_cable_plan: 'Add cable plan',
    delete_cable_plan: 'Delete cable plan',
    change_user_role: 'Change user role / package',
    admin_wallet_credit: 'Credit user wallet',
    admin_wallet_debit: 'Debit user wallet',
    delete_user: 'Delete user account'
  };
</script>

<svelte:head><title>Approvals — Admin</title></svelte:head>

<h1 class="mb-2 font-display text-xl font-bold text-ink">Pending Approvals</h1>
<p class="mb-6 text-sm text-ink/55">
  {#if isSuperAdmin}
    You are signed in as super admin — you can approve or reject changes staged by other admins.
  {:else}
    Changes that affect pricing, roles, or wallet balances are staged here for super admin review.
    Your own pending requests appear below.
  {/if}
</p>

{#if $pendingApprovals.length === 0}
  <div class="rounded-2xl bg-white px-4 py-12 text-center shadow-sm">
    <p class="text-2xl">✅</p>
    <p class="mt-2 text-sm font-medium text-ink">No pending approvals</p>
    <p class="text-xs text-ink/40">All changes are up to date</p>
  </div>
{:else}
  <div class="mb-8 divide-y divide-fanu-50 overflow-hidden rounded-2xl bg-white shadow-sm">
    {#each $pendingApprovals as approval (approval.id)}
      <div class="px-4 py-4">
        <div class="mb-2 flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-ink">{actionLabels[approval.action] ?? approval.action}</p>
            <p class="text-[11px] text-ink/45">Requested by {approval.requestedBy} · {formatDate(approval.requestedAt)}</p>
            {#if approval.note}
              <p class="mt-1 text-xs text-ink/60">Note: {approval.note}</p>
            {/if}
          </div>
          <span class="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">Pending</span>
        </div>

        <div class="mb-3 rounded-xl bg-fanu-50/60 px-3 py-2">
          {#each Object.entries(approval.payload) as [key, value]}
            <p class="text-[11px] text-ink/60"><span class="font-medium">{key}:</span> {String(value)}</p>
          {/each}
        </div>

        {#if isSuperAdmin}
          {#if rejectingId === approval.id}
            <div class="flex gap-2">
              <input
                type="text"
                bind:value={rejectNote}
                placeholder="Reason for rejection (optional)"
                class="flex-1 rounded-lg border border-fanu-100 px-2.5 py-2 text-xs focus:border-fanu-500"
              />
              <button on:click={() => handleReject(approval.id)} type="button" class="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700">
                Confirm reject
              </button>
              <button on:click={() => (rejectingId = null)} type="button" class="rounded-lg border border-fanu-100 px-3 py-2 text-xs font-semibold text-ink/60">
                Cancel
              </button>
            </div>
          {:else}
            <div class="flex gap-2">
              <button on:click={() => handleApprove(approval.id)} type="button" class="rounded-lg bg-fanu-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-fanu-700">
                Approve & apply
              </button>
              <button on:click={() => (rejectingId = approval.id)} type="button" class="rounded-lg border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                Reject
              </button>
            </div>
          {/if}
        {:else}
          <p class="text-[11px] text-ink/40">Awaiting super admin review</p>
        {/if}
      </div>
    {/each}
  </div>
{/if}

{#if $approvalQueue.filter(a => a.status !== "pending").length > 0}
  <h2 class="mb-3 font-display text-base font-semibold text-ink">History</h2>
  <div class="divide-y divide-fanu-50 overflow-hidden rounded-2xl bg-white shadow-sm">
    {#each $approvalQueue.filter(a => a.status !== "pending").slice(0, 20) as approval (approval.id)}
      <div class="flex items-start justify-between gap-3 px-4 py-3">
        <div>
          <p class="text-sm font-medium text-ink">{actionLabels[approval.action] ?? approval.action}</p>
          <p class="text-[11px] text-ink/45">
            By {approval.requestedBy} · {formatDate(approval.requestedAt)}
            {#if approval.reviewedBy} · Reviewed by {approval.reviewedBy}{/if}
          </p>
        </div>
        <span class="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
          class:bg-fanu-50={approval.status === 'approved'}
          class:text-fanu-700={approval.status === 'approved'}
          class:bg-red-50={approval.status === 'rejected'}
          class:text-red-700={approval.status === 'rejected'}
        >
          {approval.status}
        </span>
      </div>
    {/each}
  </div>
{/if}
