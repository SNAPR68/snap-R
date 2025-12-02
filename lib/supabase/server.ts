
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



export async function protect() {

  const supabase = createClient();

  const { data: { user }, error } = await supabase.auth.getUser();
  

  if (error || !user) {

    redirect('/auth/login');

  }
  

  return { user, supabase };

}

