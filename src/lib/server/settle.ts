import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_AIRTIME_CASHBACK, airtimeCashback, type AirtimeCashback } from '$lib/pricing';

/** Puts a failed order's money back in the wallet. */
export async function refundWallet(
  admin: SupabaseClient, userId: string, amount: number, reference: string, why: string
) {
  return admin.rpc('process_wallet_credit', {
    p_user_id: userId, p_amount: amount, p_source: 'refund',
    p_ref: `REFUND_${reference}`, p_description: `Refund: ${why}`.slice(0, 200)
  });
}

/**
 * Pays the airtime cashback (admin-set per ₦100, per network and package) into the wallet.
 * Returns the amount paid, or 0 if none was due or the credit failed.
 */
export async function payAirtimeCashback(
  admin: SupabaseClient,
  o: { userId: string; network: string; faceValue: number; reference: string; description: string }
): Promise<number> {
  const { data: profile } = await admin.from('profiles').select('package').eq('id', o.userId).maybeSingle();
  const { data: setting } = await admin.from('app_settings').select('value').eq('key', 'airtime_cashback').maybeSingle();

  const rates: AirtimeCashback = {};
  for (const net of Object.keys(DEFAULT_AIRTIME_CASHBACK)) {
    rates[net] = { ...DEFAULT_AIRTIME_CASHBACK[net], ...(setting?.value?.[net] ?? {}) };
  }
  const due = airtimeCashback(o.faceValue, o.network, profile?.package === 'reseller' ? 'reseller' : 'smart_user', rates);
  if (due <= 0) return 0;

  const { error } = await admin.rpc('process_wallet_credit', {
    p_user_id: o.userId, p_amount: due, p_source: 'cashback',
    p_ref: `CASHBACK_${o.reference}`, p_description: `Cashback: ${o.description}`.slice(0, 200)
  });
  if (error) { console.error('cashback credit failed:', error.message); return 0; }
  return due;
}
