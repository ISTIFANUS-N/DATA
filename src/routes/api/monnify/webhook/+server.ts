import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminClient, fetchTransaction, verifyWebhookSignature } from '$lib/server/monnify';

export const POST: RequestHandler = async ({ request }) => {
  // Signature must be checked against the exact raw body.
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get('monnify-signature'))) {
    return json({ ok: false }, { status: 401 });
  }

  const event = JSON.parse(raw);
  if (event.eventType !== 'SUCCESSFUL_TRANSACTION') return json({ ok: true, ignored: true });

  const d = event.eventData;
  const userId: string | undefined = d?.product?.reference; // accountReference = user id
  const txRef: string | undefined = d?.transactionReference;
  if (!userId || !txRef) return json({ ok: false }, { status: 400 });

  // Don't trust the payload alone — confirm the payment with Monnify.
  const verified = await fetchTransaction(txRef);
  if (!verified || verified.paymentStatus !== 'PAID') {
    return json({ ok: false, error: 'unverified' }, { status: 400 });
  }
  const amount = Number(verified.amountPaid);
  if (!(amount > 0)) return json({ ok: false }, { status: 400 });

  const admin = adminClient();

  // Idempotency: the unique transaction_reference means a retried webhook can't double-credit.
  const { error: dupe } = await admin
    .from('monnify_payments')
    .insert({ transaction_reference: txRef, user_id: userId, amount });
  if (dupe) {
    if (dupe.code === '23505') return json({ ok: true, duplicate: true });
    console.error('monnify_payments insert failed:', dupe.message);
    return json({ ok: false }, { status: 500 });
  }

  const { error } = await admin.rpc('process_wallet_credit', {
    p_user_id: userId,
    p_amount: amount,
    p_source: 'monnify_transfer',
    p_ref: txRef,
    p_description: 'Wallet funding via bank transfer'
  });
  if (error) {
    // Roll back the marker so Monnify's retry can try again.
    await admin.from('monnify_payments').delete().eq('transaction_reference', txRef);
    console.error('wallet credit failed:', error.message);
    return json({ ok: false }, { status: 500 });
  }

  return json({ ok: true });
};
