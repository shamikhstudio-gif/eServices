import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Generate cryptographic random alphanumeric slug
 */
export function generateRandomSlug(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
}

/**
 * Hash IP address with salt to respect user privacy while allowing unique visitor stats
 */
export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + '_eshamikh_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

/**
 * Record a visit/click in Supabase
 */
export async function recordLinkClick(
  slug: string,
  userAgent: string = 'Unknown',
  rawIp: string = '127.0.0.1',
  country: string = 'IQ'
) {
  try {
    const hashed = await hashIp(rawIp);

    // 1. Insert detailed click log
    await supabaseAdmin.from('link_clicks').insert({
      link_slug: slug,
      ip_hash: hashed,
      user_agent: userAgent.slice(0, 255),
      country: country || 'IQ',
    });

    // 2. Increment clicks_count in links
    const { data: link } = await supabaseAdmin
      .from('links')
      .select('id, clicks_count')
      .eq('slug', slug)
      .maybeSingle();

    if (link) {
      await supabaseAdmin
        .from('links')
        .update({ clicks_count: (link.clicks_count || 0) + 1 })
        .eq('id', link.id);
    }
  } catch (err) {
    console.error('[eLink Click Tracker Error]:', err);
  }
}
