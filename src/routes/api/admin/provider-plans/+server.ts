import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminClient } from '$lib/server/supabaseAdmin';
import { getProvider } from '$lib/server/providers';
import { ProviderUnavailable, type Network } from '$lib/server/providers/types';

const NETWORKS: Network[] = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];
const reply = (body: object, status = 200) => json(body, { status });

/** Lists the provider's real data plans for a network, so admins can copy the right plan code. */
export const GET: RequestHandler = async ({ url, locals }) => {
  const { data: { user } } = await locals.supabase.auth.getUser();
  if (!user) return reply({ ok: false, error: 'Not signed in.' }, 401);
  const { data: me } = await adminClient().from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (me?.role !== 'admin') return reply({ ok: false, error: 'Admins only.' }, 403);

  const network = (url.searchParams.get('network') ?? '').toUpperCase() as Network;
  if (!NETWORKS.includes(network)) return reply({ ok: false, error: 'Choose a network.' }, 400);

  try {
    const provider = getProvider('data');
    if (!provider.dataPlans) return reply({ ok: false, error: 'This provider cannot list plans.' }, 400);
    return reply({ ok: true, plans: await provider.dataPlans(network) });
  } catch (e) {
    if (e instanceof ProviderUnavailable) return reply({ ok: false, error: 'Provider is not configured yet.' }, 503);
    console.error('provider-plans failed:', e instanceof Error ? e.message : e);
    return reply({ ok: false, error: 'Could not load plans from the provider.' }, 502);
  }
};
