/**
 * eShamikh Cloud & Services Ecosystem
 * Next.js Edge Middleware: Anti-Tamper Verification & Central SSO Guard
 * 
 * 1. Enforces HMAC-SHA256 integrity signatures on mutating API requests (POST, PUT, PATCH, DELETE)
 * 2. Rejects any tampered request with HTTP 403 (error: REQUEST_INTEGRITY_COMPROMISED, code: 4031)
 * 3. Enforces 60-second timestamp drift limit against replay attacks
 * 4. Logs tampering incidents directly to Supabase security_audit_logs
 * 5. Provides SSO redirection to /auth?redirect_to=<ORIGIN_URL>
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const HMAC_SECRET = process.env.HMAC_SECRET_KEY || 'eshamikh_internal_hmac_secret_key_2026';
const MAX_DRIFT_MS = 60000; // 60 seconds

// Paths exempt from HMAC signing (e.g. auth callbacks and public link verification)
const EXEMPT_PATHS = ['/api/auth/callback', '/api/s'];

/**
 * Constant-time byte comparison to protect against timing attacks
 */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Computes HMAC-SHA256 hex string using Edge-compatible Web Crypto API
 */
async function computeEdgeHmac(canonical: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(canonical)
  );

  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Asynchronously logs security violations to Supabase
 */
async function recordViolation(
  endpoint: string,
  method: string,
  violationType: string,
  signature: string | null,
  timestamp: string | null,
  ip: string,
  userAgent: string,
  metadata: any
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) return;

    await fetch(`${supabaseUrl}/rest/v1/security_audit_logs`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        ip_address: ip,
        user_agent: userAgent,
        endpoint,
        http_method: method,
        violation_type: violationType,
        signature_received: signature,
        timestamp_received: timestamp,
        metadata,
      }),
    });
  } catch (e) {
    // Non-blocking log failure
    console.error('Failed to log security audit event:', e);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  // =========================================================================
  // 1. Anti-Tamper & HMAC Verification for Mutating API Requests
  // =========================================================================
  if (
    pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
    !EXEMPT_PATHS.some((p) => pathname.startsWith(p))
  ) {
    const signature = request.headers.get('x-signature');
    const timestamp = request.headers.get('x-timestamp');

    // A. Check for missing headers
    if (!signature || !timestamp) {
      await recordViolation(
        pathname,
        method,
        'MISSING_HEADERS',
        signature,
        timestamp,
        ip,
        userAgent,
        { reason: 'Missing X-Signature or X-Timestamp header' }
      );

      return NextResponse.json(
        { error: 'REQUEST_INTEGRITY_COMPROMISED', code: 4031 },
        { status: 403 }
      );
    }

    // B. Check for timestamp drift (replay attack prevention)
    const requestTime = parseInt(timestamp, 10);
    const now = Date.now();

    if (isNaN(requestTime) || Math.abs(now - requestTime) > MAX_DRIFT_MS) {
      await recordViolation(
        pathname,
        method,
        'TIMESTAMP_SKEW_EXCEEDED',
        signature,
        timestamp,
        ip,
        userAgent,
        { drift_ms: Math.abs(now - requestTime), server_time: now }
      );

      return NextResponse.json(
        { error: 'REQUEST_INTEGRITY_COMPROMISED', code: 4031 },
        { status: 403 }
      );
    }

    // C. Read body text safely without consuming the stream for the downstream handler
    let bodyText = '{}';
    try {
      const cloned = request.clone();
      bodyText = await cloned.text();
      if (!bodyText || bodyText.trim() === '') {
        bodyText = '{}';
      }
    } catch {
      bodyText = '{}';
    }

    // Normalize JSON string representation if valid JSON
    let normalizedBody = bodyText;
    try {
      normalizedBody = JSON.stringify(JSON.parse(bodyText));
    } catch {
      normalizedBody = bodyText;
    }

    // D. Compute expected signature on the canonical string
    const canonical = `${method}:${pathname}:${timestamp}:${normalizedBody}`;
    const expectedSignature = await computeEdgeHmac(canonical, HMAC_SECRET);

    // E. Timing-safe comparison
    if (!timingSafeEqualHex(expectedSignature, signature)) {
      await recordViolation(
        pathname,
        method,
        'INVALID_SIGNATURE',
        signature,
        timestamp,
        ip,
        userAgent,
        {
          expected_prefix: expectedSignature.slice(0, 8),
          received_prefix: signature.slice(0, 8),
          body_length: bodyText.length,
        }
      );

      return NextResponse.json(
        { error: 'REQUEST_INTEGRITY_COMPROMISED', code: 4031 },
        { status: 403 }
      );
    }
  }

  // =========================================================================
  // 2. eStore Routing & Guard
  // =========================================================================
  // Automatic redirects for legacy/shortcut routes
  if (pathname === '/services' || pathname.startsWith('/services/')) {
    return NextResponse.redirect(new URL('/estore/dashboard', request.url));
  }
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/estore/dashboard', request.url));
  }

  // Protect merchant dashboard and account settings
  if (
    pathname.startsWith('/estore/dashboard') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/elink')
  ) {
    const allCookies = request.cookies.getAll();
    const hasAuthCookie = allCookies.some((c) =>
      (c.name.startsWith('sb-') && (c.name.includes('-auth-token') || c.name.includes('access-token'))) ||
      c.name === 'eshamikh_session' ||
      c.name === 'supabase-auth-token'
    );

    const isDemo =
      request.nextUrl.searchParams.get('demo') === 'true' ||
      request.nextUrl.searchParams.get('preview') === 'true';

    if (!hasAuthCookie && !isDemo) {
      const authUrl = new URL('/auth', request.url);
      authUrl.searchParams.set('redirect_to', request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(authUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/services/:path*',
    '/services',
    '/dashboard',
    '/account/:path*',
    '/elink/:path*',
    '/estore/dashboard/:path*',
  ],
};
