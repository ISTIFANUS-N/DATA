import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = locals.session;
  if (!session) throw redirect(303, '/login');

  // Check role from Supabase
  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('role, package')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw redirect(303, '/dashboard');
  }

  return { role: profile.role, package: profile.package };
};
