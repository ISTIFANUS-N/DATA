import { createBrowserClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, fetch }) => {
  const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    global: { fetch }
  });

  const { data: { session } } = isBrowser()
    ? await supabase.auth.getSession()
    : { data: { session: data.session } };

  return { supabase, session };
};
