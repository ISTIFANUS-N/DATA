import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminClient } from '$lib/server/supabaseAdmin';
import { getProvider } from '$lib/server/providers';
import { ProviderUnavailable } from '$lib/server/providers/types';
import { payAirtimeCashback, refundWallet } from '$lib/server/settle';

const reply = (body: object, status = 200) => json(body, { status });

/**
 * Asks the provider what really happened to a pending airtime/data order and settles it:
 * delivered -> success (+ cashback), failed -> refund. Allowed for admins or the order's owner.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  const { data: { user } } = await locals.supabase.auth.getUser();
  if (!user) return reply({ ok: false, error: 'Not signed in.' }, 401);

  const body = await request.json().catch(() => null);
  const id = String(body?.transactionId ?? '');
  if (!id) return reply({ ok: false, error: 'Missing transaction.' }, 400);

  const admin = adminClient();
  const [{ data: tx }, { data: me }] = await Promise.all([
    admin.from('service_transactions')
      .select('id, user_id, service_type, status, amount, reference, description, provider_network').eq('id', id).maybeSingle(),
    admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  ]);
  if (!tx) return reply({ ok: false, error: 'Transaction not found.' }, 404);
  if (tx.user_id !== user.id && me?.role !== 'admin') return reply({ ok: false, error: 'Not allowed.' }, 403);
  if (tx.service_type !== 'airtime' && tx.service_type !== 'data') {
    return reply({ ok: false, error: 'Only airtime and data orders can be checked.' }, 400);
  }
  if (tx.status !== 'pending') return reply({ ok: true, status: tx.status, changed: false });

  let result;
  try {
    const provider = getProvider(tx.service_type);
    if (!provider.requery) return reply({ ok: false, error: 'This provider cannot check order status.' }, 400);
    result = await provider.requery(tx.reference);
  } catch (e) {
    if (e instanceof ProviderUnavailable) return reply({ ok: false, error: 'Provider is not configured.' }, 503);
    console.error('requery failed:', e instanceof Error ? e.message : e);
    return reply({ ok: false, error: 'Could not reach the provider. Try again.' }, 502);
  }

  if (result.status === 'pending') return reply({ ok: true, status: 'pending', changed: false, message: result.message });

  // Claim the order first so a double click can't refund or pay cashback twice.
  const { data: claimed } = await admin.from('service_transactions')
    .update({ status: result.status }).eq('id', tx.id).eq('status', 'pending').select('id');
  if (!claimed?.length) return reply({ ok: true, status: result.status, changed: false });

  let cashback = 0;
  if (result.status === 'failed') {
    const { error } = await refundWallet(admin, tx.user_id, Number(tx.amount), tx.reference, result.message ?? 'order failed');
    if (error) {
      console.error('requery refund failed:', error.message);
      await admin.from('service_transactions').update({ status: 'pending' }).eq('id', tx.id); // let it be retried
      return reply({ ok: false, error: 'The order failed but the refund could not be completed. Try again.' }, 500);
    }
  } else if (tx.service_type === 'airtime') {
    cashback = await payAirtimeCashback(admin, {
      userId: tx.user_id, network: tx.provider_network ?? '', faceValue: Number(tx.amount),
      reference: tx.reference, description: tx.description ?? ''
    });
  }
  return reply({ ok: true, status: result.status, changed: true, cashback });
};
