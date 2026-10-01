import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminClient } from '$lib/server/supabaseAdmin';
import { getProvider, newReference } from '$lib/server/providers';
import { ProviderUnavailable, type Network, type ProviderResult } from '$lib/server/providers/types';
import { applyPackagePricing } from '$lib/pricing';
import { normalizePhone } from '$lib/network';

const NETWORKS: Network[] = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];
const UNAVAILABLE = 'Service temporarily unavailable. Please try again shortly.';

const fail = (error: string, status = 400) => json({ ok: false, error }, { status });

export const POST: RequestHandler = async ({ request, locals }) => {
  const { data: { user } } = await locals.supabase.auth.getUser();
  if (!user) return fail('Not signed in.', 401);

  const body = await request.json().catch(() => null);
  const type = body?.type;
  if (type !== 'airtime' && type !== 'data') return fail('Unsupported service.');

  const meta = body?.meta ?? {};
  const network = String(meta.network ?? '') as Network;
  const phone = normalizePhone(String(meta.phoneNumber ?? ''));
  if (!NETWORKS.includes(network)) return fail('Choose a network.');
  if (!/^0\d{10}$/.test(phone)) return fail('Enter a valid 11-digit phone number.');

  const admin = adminClient();

  // ── Work out what to charge ─────────────────────────────────────────────
  let charge: number;
  let faceValue = 0;
  let planCode = '';

  if (type === 'airtime') {
    // Charge is derived here from the face value + the user's package, never taken from the client.
    faceValue = Number(meta.faceAmount);
    if (!Number.isInteger(faceValue) || faceValue < 50 || faceValue > 50_000) {
      return fail('Airtime must be between ₦50 and ₦50,000.');
    }
    const { data: profile } = await admin
      .from('profiles').select('package').eq('id', user.id).maybeSingle();
    charge = applyPackagePricing(faceValue, 'airtime', profile?.package === 'reseller' ? 'reseller' : 'smart_user');
  } else {
    // Data plan prices are still managed client-side, so this amount can't be verified here yet.
    planCode = String(meta.apiPlanId ?? '').trim();
    charge = Number(body?.amount);
    if (!planCode) return fail('Choose a data plan.');
    if (!Number.isFinite(charge) || charge <= 0 || charge > 100_000) return fail('Invalid amount.');
  }

  // ── Pick the provider BEFORE touching money ─────────────────────────────
  let provider;
  try {
    provider = getProvider(type);
  } catch (e) {
    if (e instanceof ProviderUnavailable) {
      console.error('purchase: provider unavailable:', e.message);
      return fail(UNAVAILABLE, 503);
    }
    throw e;
  }

  const { data: wallet } = await admin
    .from('wallets').select('balance').eq('user_id', user.id).maybeSingle();
  if (!wallet || Number(wallet.balance) < charge) {
    return fail(`Insufficient balance. Need ₦${charge.toLocaleString()}.`);
  }

  const reference = newReference();
  const description = String(body?.description ?? `${network} ${type} · ${phone}`).slice(0, 200);

  // ── Debit, then record ─────────────────────────────────────────────────
  const { error: debitErr } = await admin.rpc('process_wallet_debit', {
    p_user_id: user.id, p_amount: charge, p_source: `${type}_purchase`,
    p_ref: reference, p_description: description
  });
  if (debitErr) {
    console.error('purchase: debit failed:', debitErr.message);
    return fail(/insufficient/i.test(debitErr.message) ? 'Insufficient balance.' : 'Could not process payment.', 400);
  }

  const refund = (why: string) => admin.rpc('process_wallet_credit', {
    p_user_id: user.id, p_amount: charge, p_source: 'refund',
    p_ref: `REFUND_${reference}`, p_description: `Refund: ${why}`.slice(0, 200)
  });

  const { data: row, error: insertErr } = await admin
    .from('service_transactions')
    .insert({
      user_id: user.id,
      service_type: type,
      status: 'pending',
      amount: charge,
      reference,
      description,
      provider_network: network,
      data_plan_type_used: type === 'data' ? (meta.planType ?? null) : null,
      provider_name: provider.name
    })
    .select('id, created_at')
    .single();
  if (insertErr || !row) {
    console.error('purchase: could not record transaction:', insertErr?.message);
    await refund('could not record order');
    return fail('Could not process your order. You have not been charged.', 500);
  }

  // ── Call the provider ──────────────────────────────────────────────────
  let result: ProviderResult;
  try {
    result = type === 'airtime'
      ? await provider.airtime!({ reference, network, phone, amount: faceValue })
      : await provider.data!({ reference, network, phone, planCode, amount: charge });
  } catch (e) {
    console.error('purchase: provider threw:', e instanceof Error ? e.message : e);
    result = { status: 'pending', message: 'Provider error' }; // unknown outcome: don't refund blindly
  }

  if (result.status === 'failed') await refund(result.message ?? 'provider declined');
  await admin.from('service_transactions').update({ status: result.status }).eq('id', row.id);

  return json({
    ok: true,
    transaction: { id: row.id, status: result.status, reference, created_at: row.created_at }
  });
};
