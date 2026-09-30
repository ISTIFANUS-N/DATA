import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll:    () => event.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            event.cookies.set(name, value, { ...options, path: '/' })
          );
        }
      }
    }
  );

  // Refresh the session on every request so it doesn't silently expire
  event.locals.session = (await event.locals.supabase.auth.getSession()).data.session;

  return resolve(event, {
    filterSerializedResponseHeaders: (name) => name === 'content-range' || name === 'x-supabase-api-version'
  });
};
