import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { adminClient } from '$lib/server/supabaseAdmin';
import { getProvider } from '$lib/server/providers';
import type { ProviderService } from '$lib/server/providers/types';

const SERVICES: ProviderService[] = ['airtime', 'data', 'electricity', 'cable'];
const reply = (body: object, status = 200) => json(body, { status });

async function requireAdmin(locals: App.Locals) {
  const { data: { user } } = await locals.supabase.auth.getUser();
  if (!user) return false;
  const { data: me } = await adminClient().from('profiles').select('role').eq('id', user.id).maybeSingle();
  return me?.role === 'admin';
}

/** Shows, per service, which provider the server is using and why one might be "unavailable". No secrets. */
export const GET: RequestHandler = async ({ locals }) => {
  if (!(await requireAdmin(locals))) return reply({ ok: false, error: 'Admins only.' }, 403);

  const services = SERVICES.map((service) => {
    const configured = (env[`PROVIDER_${service.toUpperCase()}`] ?? '').trim();
    try {
      const p = getProvider(service);
      return { service, configured, ready: true, provider: p.name, reason: null as string | null };
    } catch (e) {
      return { service, configured, ready: false, provider: null, reason: e instanceof Error ? e.message : 'Unavailable' };
    }
  });

  return reply({
    ok: true,
    services,
    env: {
      flowpay: { baseUrl: env.FLOWPAY_BASE_URL ?? null, token: !!env.FLOWPAY_API_TOKEN },
      vtpass: {
        baseUrl: env.VTPASS_BASE_URL ?? null,
        apiKey: !!env.VTPASS_API_KEY, publicKey: !!env.VTPASS_PUBLIC_KEY, secretKey: !!env.VTPASS_SECRET_KEY
      },
      supabaseServiceKey: !!env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
};

/** Live connection test: asks the data provider for its MTN plan list (uses your token, spends nothing). */
export const POST: RequestHandler = async ({ locals }) => {
  if (!(await requireAdmin(locals))) return reply({ ok: false, error: 'Admins only.' }, 403);
  try {
    const provider = getProvider('data');
    if (!provider.dataPlans) return reply({ ok: false, error: `${provider.name} cannot list plans, so it cannot be tested this way.` });
    const plans = await provider.dataPlans('MTN');
    return reply({ ok: true, provider: provider.name, count: plans.length });
  } catch (e) {
    return reply({ ok: false, error: e instanceof Error ? e.message : 'Connection test failed' });
  }
};
