/**
 * eShamikh Cloud & Services Ecosystem
 * Browser Supabase Client with Root Domain Cookie Sharing (.eshamikh.com)
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const isProd = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.eshamikh.com';

  return createBrowserClient(supabaseUrl, supabaseKey, {
    cookieOptions: {
      domain: isProd ? cookieDomain : undefined,
      path: '/',
      sameSite: 'lax',
      secure: isProd,
    },
  });
}
