/**
 * eShamikh Cloud & Services Ecosystem
 * Client-Side HMAC-SHA256 Request Signer (Anti-Tamper Engine)
 * 
 * Ensures all mutating requests (POST, PUT, PATCH, DELETE) carry cryptographic signatures
 * and timestamps to prevent payload tampering and replay attacks.
 */

export interface SignedHeaders {
  'X-Signature': string;
  'X-Timestamp': string;
  'Content-Type': string;
  [key: string]: string;
}

const DEFAULT_SECRET = process.env.NEXT_PUBLIC_HMAC_CLIENT_KEY || 'eshamikh_internal_hmac_secret_key_2026';

/**
 * Builds canonical string: `${METHOD}:${PATHNAME}:${TIMESTAMP}:${JSON_BODY}`
 */
export function buildCanonicalPayload(
  method: string,
  pathname: string,
  timestamp: string,
  body?: any
): string {
  const normMethod = method.toUpperCase();
  let bodyStr = '{}';

  if (body !== undefined && body !== null) {
    if (typeof body === 'string') {
      try {
        // Ensure consistent formatting if it's already a JSON string
        bodyStr = JSON.stringify(JSON.parse(body));
      } catch {
        bodyStr = body;
      }
    } else {
      bodyStr = JSON.stringify(body);
    }
  }

  return `${normMethod}:${pathname}:${timestamp}:${bodyStr}`;
}

/**
 * Computes HMAC-SHA256 hex digest using Web Crypto API in browser or Node crypto in Node
 */
export async function computeHmacSha256(
  canonical: string,
  secretKey: string = DEFAULT_SECRET
): Promise<string> {
  // If in modern browser or edge environment with crypto.subtle
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuf = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(canonical)
    );

    return Array.from(new Uint8Array(signatureBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Fallback to Node.js crypto module if running server-side or in tests
  try {
    const nodeCrypto = await import('crypto');
    return nodeCrypto
      .createHmac('sha256', secretKey)
      .update(canonical)
      .digest('hex');
  } catch (err) {
    throw new Error(`Crypto API unavailable for HMAC calculation: ${err}`);
  }
}

/**
 * Generates security headers for a request
 */
export async function signRequest(
  method: string,
  pathname: string,
  body?: any,
  secretKey: string = DEFAULT_SECRET,
  customTimestamp?: string
): Promise<SignedHeaders> {
  const timestamp = customTimestamp || Date.now().toString();
  const canonical = buildCanonicalPayload(method, pathname, timestamp, body);
  const signature = await computeHmacSha256(canonical, secretKey);

  return {
    'X-Signature': signature,
    'X-Timestamp': timestamp,
    'Content-Type': 'application/json',
  };
}

/**
 * Drop-in wrapper for fetch() that automatically signs modifying requests
 */
export async function signedFetch(
  input: string | URL | Request,
  init?: RequestInit,
  secretKey: string = DEFAULT_SECRET
): Promise<Response> {
  let urlStr = '';
  let pathname = '/';

  if (typeof input === 'string') {
    urlStr = input;
    try {
      pathname = new URL(input, typeof window !== 'undefined' ? window.location.origin : 'http://localhost').pathname;
    } catch {
      pathname = input.split('?')[0];
    }
  } else if (input instanceof URL) {
    urlStr = input.toString();
    pathname = input.pathname;
  } else if (typeof Request !== 'undefined' && input instanceof Request) {
    urlStr = input.url;
    pathname = new URL(input.url).pathname;
  }

  const method = (init?.method || 'GET').toUpperCase();
  const headers = new Headers(init?.headers);

  // Apply signature to modifying requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const body = init?.body;
    const signed = await signRequest(method, pathname, body, secretKey);
    headers.set('X-Signature', signed['X-Signature']);
    headers.set('X-Timestamp', signed['X-Timestamp']);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
