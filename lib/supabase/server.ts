/**
 * eShamikh Cloud & Services Ecosystem
 * Server-Side Supabase Client with Cookie Handlers
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.eshamikh.com';

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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                domain: isProd ? cookieDomain : undefined,
                path: '/',
                sameSite: 'lax',
                secure: isProd,
              });
            });
          } catch {
            // Ignored when called from Server Component
          }
        },
      },
    }
  );
}
