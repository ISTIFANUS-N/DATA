import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_MONNIFY_CONTRACT_CODE } from '$env/static/public';
import { adminClient, createReservedAccount } from '$lib/server/monnify';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { data: { user } } = await locals.supabase.auth.getUser();
  if (!user) return json({ ok: false, error: 'Not signed in.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const bvn = String(body?.bvn ?? '');
  if (!/^\d{11}$/.test(bvn)) {
    return json({ ok: false, error: 'Enter a valid 11-digit BVN.' }, { status: 400 });
  }

  const admin = adminClient();

  // Already has one — just return it.
  const { data: existing } = await admin
    .from('reserved_accounts').select('*').eq('user_id', user.id).maybeSingle();
  if (existing) return json({ ok: true, account: existing });

  const { data: profile } = await admin
    .from('profiles').select('full_name, email').eq('id', user.id).maybeSingle();
  const name = profile?.full_name?.trim();
  const email = profile?.email ?? user.email;
  if (!name || !email) {
    return json({ ok: false, error: 'Complete your profile (full name) first.' }, { status: 400 });
  }

  try {
    // The BVN goes to Monnify only. It is never logged or stored by us.
    const acc = await createReservedAccount({ reference: user.id, name, email, bvn });

    const row = {
      user_id: user.id,
      account_reference: user.id, // the reference we registered with Monnify
      contract_code: PUBLIC_MONNIFY_CONTRACT_CODE,
      account_number: acc.accountNumber,
      account_name: acc.accountName,
      bank_name: acc.bankName,
      bank_code: acc.bankCode,
      bvn_verified: true
    };
    const { error } = await admin.from('reserved_accounts').insert(row);
    if (error) throw new Error(error.message);

    return json({ ok: true, account: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Could not create account';
    console.error('reserved-account failed:', msg);
    return json({ ok: false, error: msg }, { status: 502 });
  }
};
