import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProvider } from '$lib/server/providers';
import { ProviderUnavailable } from '$lib/server/providers/types';

const DISCOS = ['IKEDC', 'EKEDC', 'AEDC', 'PHEDC', 'KEDCO', 'IBEDC', 'EEDC', 'JEDC', 'KAEDCO', 'YEDC', 'BEDC', 'ABA'];
const CABLE = ['DSTV', 'GOTV', 'STARTIMES'] as const;

const reply = (body: object, status = 200) => json(body, { status });

/** Looks up the real customer behind a meter number or smartcard/IUC number. */
export const POST: RequestHandler = async ({ request, locals }) => {
  const { data: { user } } = await locals.supabase.auth.getUser();
  if (!user) return reply({ ok: false, error: 'Not signed in.' }, 401);

  const body = await request.json().catch(() => null);
  const kind = body?.kind;
  const code = String(body?.code ?? '').toUpperCase();
  const number = String(body?.number ?? '').replace(/\s/g, '');

  if (!/^\d+$/.test(number)) return reply({ ok: true, valid: false, error: 'Use digits only.' });

  try {
    if (kind === 'electricity') {
      if (!DISCOS.includes(code)) return reply({ ok: false, error: 'Choose an electricity company.' }, 400);
      if (number.length < 10 || number.length > 13) {
        return reply({ ok: true, valid: false, error: 'A meter number has 10 to 13 digits.' });
      }
      const meterType = body?.meterType === 'postpaid' ? 'postpaid' : 'prepaid';
      const result = await getProvider('electricity').verifyMeter!({ disco: code, meterNumber: number, meterType });
      return reply({ ok: true, ...result });
    }

    if (kind === 'cable') {
      const provider = CABLE.find((c) => c === code);
      if (!provider) return reply({ ok: false, error: 'Choose a cable provider.' }, 400);
      if (number.length < 10 || number.length > 11) {
        return reply({ ok: true, valid: false, error: 'A smartcard / IUC number has 10 or 11 digits.' });
      }
      const result = await getProvider('cable').verifySmartcard!({ provider, smartcardNumber: number });
      return reply({ ok: true, ...result });
    }

    return reply({ ok: false, error: 'Unsupported lookup.' }, 400);
  } catch (e) {
    if (e instanceof ProviderUnavailable) {
      console.error('validate: provider unavailable:', e.message);
      return reply({ ok: false, error: 'Account verification is not available right now. Please try again later.' }, 503);
    }
    console.error('validate failed:', e instanceof Error ? e.message : e);
    return reply({ ok: false, error: 'Could not verify this number. Please try again.' }, 500);
  }
};
