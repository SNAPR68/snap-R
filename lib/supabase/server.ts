
import { createServerClient } from '@supabase/ssr';

import { cookies } from 'next/headers';

import { redirect } from 'next/navigation';



export function createClient() {

  const cookieStore = cookies();

  return createServerClient(

    process.env.NEXT_PUBLIC_SUPABASE_URL!,

    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,

    {

      cookies: {

        getAll() {

          return cookieStore.getAll();

        },

        setAll(cookiesToSet) {

          try {

            cookiesToSet.forEach(({ name, value, options }) =>

              cookieStore.set(name, value, options)

            );

          } catch {}

        },

      },

    }

  );

}



export const createSupabaseServerClient = createClient;

/**
 * Create a Supabase client that supports Bearer token auth (for mobile API routes).
 * Falls back to cookie-based auth if no Authorization header is present.
 */
export function createClientFromRequest(request: { headers: { get(name: string): string | null } }) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    // Mobile path: use the access token directly via @supabase/ssr with token override
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        cookies: {
          getAll() { return []; },
          setAll() { /* no-op for bearer token auth */ },
        },
      }
    );
  }

  // Web path: use cookie-based auth
  return createClient();
}

export async function protect() {

  const supabase = createClient();

  const { data: { user }, error } = await supabase.auth.getUser();
  

  if (error || !user) {

    redirect('/auth/login');

  }
  

  return { user, supabase };

}

