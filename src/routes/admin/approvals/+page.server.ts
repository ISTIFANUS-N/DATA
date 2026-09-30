import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;
  if (!session) throw redirect(303, '/login');

  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('role, package')
    .eq('id', session.user.id)
    .single();

  // Must be super admin (role=admin AND package=reseller)
  if (!profile || profile.role !== 'admin' || profile.package !== 'reseller') {
    throw redirect(303, '/admin');
  }

  return {};
};
