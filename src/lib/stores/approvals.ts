import { derived, get } from 'svelte/store';
import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import { currentProfile } from './db';
import type { PendingApproval, ApprovalAction } from '$lib/types';

// Approval queue is stored in Supabase (approval_queue table).
// For the UI we keep a local reactive store that's loaded on demand.
export const approvalQueue = writable<PendingApproval[]>([]);

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function getCallerInfo(): { email: string; id: string; isSuperAdmin: boolean } {
  const profile = get(currentProfile);
  return {
    email: profile?.email ?? 'unknown',
    id: profile?.id ?? 'unknown',
    isSuperAdmin: profile?.role === 'admin' && profile?.package === 'reseller'
  };
}

// Load approval queue from Supabase
export async function loadApprovalQueue(): Promise<void> {
  const { data } = await supabase
    .from('approval_queue')
    .select('*')
    .order('requested_at', { ascending: false });

  if (data) {
    approvalQueue.set(data.map(r => ({
      id:          r.id,
      action:      r.action,
      requestedBy: r.requested_by,
      requestedAt: r.requested_at,
      status:      r.status,
      reviewedBy:  r.reviewed_by,
      reviewedAt:  r.reviewed_at,
      note:        r.note,
      payload:     r.payload
    })));
  }
}

/**
 * Stages a change for super admin approval OR applies immediately if caller is super admin.
 */
export async function stageApproval(
  action: ApprovalAction,
  payload: Record<string, unknown>,
  note?: string
): Promise<{ staged: true } | { staged: false }> {
  const caller = getCallerInfo();

  // Super admin applies immediately — no staging needed
  if (caller.isSuperAdmin) return { staged: false };

  // Regular admin — insert into approval_queue in Supabase
  const { error } = await supabase.from('approval_queue').insert({
    action,
    requested_by: caller.id,
    status:       'pending',
    note:         note ?? null,
    payload
  });

  if (error) {
    console.error('Failed to stage approval:', error.message);
  }

  await loadApprovalQueue();
  return { staged: true };
}

// Derived counts
export const pendingApprovals = derived(approvalQueue, ($q) =>
  $q.filter(a => a.status === 'pending')
);

export const pendingCount = derived(pendingApprovals, ($p) => $p.length);

/**
 * Super admin approves and applies a staged change.
 */
export async function approveChange(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const caller = getCallerInfo();
  if (!caller.isSuperAdmin) return { ok: false, error: 'Super admin access required.' };

  const queue = get(approvalQueue);
  const approval = queue.find(a => a.id === id);
  if (!approval) return { ok: false, error: 'Approval not found.' };
  if (approval.status !== 'pending') return { ok: false, error: 'Already reviewed.' };

  let applyError: string | null = null;

  // Apply the change based on action type
  try {
    const p = approval.payload;

    switch (approval.action) {
      case 'delete_user': {
        const { error } = await supabase.rpc('super_admin_set_role', {
          p_target_user_id: p.targetUserId as string,
          p_role: 'customer',
          p_package: 'smart_user'
        });
        if (error) {
          // If role change fails, still proceed — just mark user for deletion
          console.warn('Role reset before delete failed:', error.message);
        }
        // Delete via admin API (requires service role — done server-side)
        const { data, error: fnError } = await supabase.functions.invoke('admin-delete-user', {
          body: { userId: p.targetUserId }
        });
        if (fnError || !data?.ok) applyError = data?.error ?? fnError?.message ?? 'Delete failed';
        break;
      }

      case 'admin_wallet_credit':
      case 'admin_wallet_debit': {
        const direction = approval.action === 'admin_wallet_credit' ? 'credit' : 'debit';
        const { error } = await supabase.rpc(
          direction === 'credit' ? 'process_wallet_credit' : 'process_wallet_debit',
          {
            p_user_id:     p.targetUserId,
            p_amount:      p.amount,
            p_source:      'admin_adjustment',
            p_ref:         `ADJ_${Date.now()}`,
            p_description: p.note ?? 'Admin adjustment'
          }
        );
        if (error) applyError = error.message;
        break;
      }

      case 'change_user_role': {
        const { error } = await supabase.rpc('super_admin_set_role', {
          p_target_user_id: p.targetUserId,
          p_role:           p.role,
          p_package:        p.package ?? 'smart_user'
        });
        if (error) applyError = error.message;
        break;
      }

      case 'add_data_plan':
      case 'update_data_plan_price':
      case 'delete_data_plan':
      case 'add_cable_plan':
      case 'update_cable_plan_price':
      case 'delete_cable_plan': {
        // These modify catalog tables directly
        const { error } = await supabase
          .from(approval.action.includes('cable') ? 'cable_plans' : 'data_plans')
          .upsert(p as Record<string, unknown>);
        if (error) applyError = error.message;
        break;
      }

      default:
        applyError = `Unhandled action: ${approval.action}`;
    }
  } catch (err) {
    applyError = String(err);
  }

  if (applyError) return { ok: false, error: applyError };

  // Mark as approved in Supabase
  await supabase
    .from('approval_queue')
    .update({
      status:      'approved',
      reviewed_by: caller.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id);

  await loadApprovalQueue();
  return { ok: true };
}

/**
 * Super admin rejects a staged change.
 */
export async function rejectChange(id: string, reason?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const caller = getCallerInfo();
  if (!caller.isSuperAdmin) return { ok: false, error: 'Super admin access required.' };

  const { error } = await supabase
    .from('approval_queue')
    .update({
      status:      'rejected',
      reviewed_by: caller.id,
      reviewed_at: new Date().toISOString(),
      note:        reason ?? null
    })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  await loadApprovalQueue();
  return { ok: true };
}
