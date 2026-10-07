import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminClient } from '$lib/server/supabaseAdmin';
import { getProvider, newReference } from '$lib/server/providers';
import { ProviderUnavailable, type Network, type ProviderResult } from '$lib/server/providers/types';
import { payAirtimeCashback, refundWallet } from '$lib/server/settle';
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
  let planType: string | null = null;
  let description = String(body?.description ?? `${network} ${type} · ${phone}`).slice(0, 200);

  if (type === 'airtime') {
    // The face value is what's charged; it is read from meta, never from the client-supplied amount.
    faceValue = Number(meta.faceAmount);
    if (!Number.isInteger(faceValue) || faceValue < 50 || faceValue > 50_000) {
      return fail('Airtime must be between ₦50 and ₦50,000.');
    }
    charge = faceValue; // customers always pay full price; any reward comes back as cashback
  } else {
    // The plan, its price and the provider plan code all come from our database, never from the browser.
    const planId = String(meta.planId ?? '');
    const { data: plan } = await admin
      .from('catalog_data_plans').select('*').eq('id', planId).maybeSingle();
    if (!plan || !plan.is_active) return fail('That plan is no longer available. Please pick another.');
    if (plan.network !== network) return fail('That plan does not match the selected network.');

    const { data: typeSetting } = await admin
      .from('app_settings').select('value').eq('key', 'data_plan_types').maybeSingle();
    if (typeSetting?.value?.[plan.plan_type] === false) return fail('That plan type is unavailable right now.');

    const { data: profile } = await admin.from('profiles').select('package').eq('id', user.id).maybeSingle();
    planCode = String(plan.api_plan_id).trim();
    charge = applyPackagePricing(Number(plan.price), 'data', profile?.package === 'reseller' ? 'reseller' : 'smart_user');
    planType = plan.plan_type;
    description = `${plan.size_value}${plan.size_unit} · ${plan.validity} · ${phone}`;
    if (!planCode) return fail('This plan is not set up yet. Please pick another.');
  }

  // ── Pick the provider BEFORE touching money ─────────────────────────────
  let provider;
  try {
    provider = getProvider(type);
  } catch (e) {
    if (e instanceof ProviderUnavailable) {
      console.error('purchase: provider unavailable:', e.message);
      // Admins also see the real reason, so setup problems are easy to spot while testing.
      const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
      return fail(me?.role === 'admin' ? `${UNAVAILABLE} (Admin note: ${e.message})` : UNAVAILABLE, 503);
    }
    throw e;
  }

  if (type === 'airtime' && provider.airtimeLimits) {
    const { min, max } = provider.airtimeLimits;
    if (faceValue < min || faceValue > max) {
      return fail(`Airtime must be between ₦${min.toLocaleString()} and ₦${max.toLocaleString()} for now.`);
    }
  }

  const { data: wallet } = await admin
    .from('wallets').select('balance').eq('user_id', user.id).maybeSingle();
  if (!wallet || Number(wallet.balance) < charge) {
    return fail(`Insufficient balance. Need ₦${charge.toLocaleString()}.`);
  }

  const reference = newReference();

  // ── Debit, then record ─────────────────────────────────────────────────
  const { error: debitErr } = await admin.rpc('process_wallet_debit', {
    p_user_id: user.id, p_amount: charge, p_source: `${type}_purchase`,
    p_ref: reference, p_description: description
  });
  if (debitErr) {
    console.error('purchase: debit failed:', debitErr.message);
    return fail(/insufficient/i.test(debitErr.message) ? 'Insufficient balance.' : 'Could not process payment.', 400);
  }

  const refund = (why: string) => refundWallet(admin, user.id, charge, reference, why);

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
      data_plan_type_used: type === 'data' ? planType : null,
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
    result = e instanceof ProviderUnavailable
      ? { status: 'failed', message: 'Provider not configured' }  // nothing was sent, so refund
      : { status: 'pending', message: 'Provider error' };         // unknown outcome: don't refund blindly
  }

  if (result.status === 'failed') await refund(result.message ?? 'provider declined');
  await admin.from('service_transactions').update({ status: result.status }).eq('id', row.id);

  // Cashback for airtime, paid into the main wallet only once delivery is confirmed.
  const cashback = type === 'airtime' && result.status === 'success'
    ? await payAirtimeCashback(admin, { userId: user.id, network, faceValue, reference, description, providerCost: result.cost })
    : 0;

  return json({
    ok: true,
    transaction: { id: row.id, status: result.status, reference, created_at: row.created_at },
    cashback
  });
};
