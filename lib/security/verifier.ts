/**
 * eShamikh Cloud & Services Ecosystem
 * Server-Side HMAC-SHA256 Verification & Anti-Tamper Engine
 * 
 * Verifies request signatures and timestamps, resists timing attacks,
 * and logs integrity compromises to security_audit_logs in Supabase.
 */

import crypto from 'crypto';
import { buildCanonicalPayload } from './signer';

export interface VerificationResult {
  valid: boolean;
  error?: string;
  code?: number;
  violationType?: 'MISSING_HEADERS' | 'TIMESTAMP_SKEW_EXCEEDED' | 'INVALID_SIGNATURE';
  details?: {
    receivedSignature?: string;
    receivedTimestamp?: string;
    driftMs?: number;
  };
}

const SERVER_SECRET = process.env.HMAC_SECRET_KEY || 'eshamikh_internal_hmac_secret_key_2026';
const MAX_DRIFT_MS = 60000; // 60 seconds tolerance

/**
 * Validates the HMAC signature and timestamp of an incoming HTTP request
 */
export function verifyRequestIntegrity(
  method: string,
  pathname: string,
  headers: Headers | Record<string, string | string[] | undefined>,
  bodyText: string = '{}',
  secretKey: string = SERVER_SECRET
): VerificationResult {
  const normMethod = method.toUpperCase();

  // Extract headers safely across different environments
  let signature: string | null = null;
  let timestamp: string | null = null;

  if (headers instanceof Headers) {
    signature = headers.get('x-signature');
    timestamp = headers.get('x-timestamp');
  } else {
    const sigKey = Object.keys(headers).find((k) => k.toLowerCase() === 'x-signature');
    const tsKey = Object.keys(headers).find((k) => k.toLowerCase() === 'x-timestamp');
    const rawSig = sigKey ? headers[sigKey] : null;
    const rawTs = tsKey ? headers[tsKey] : null;
    signature = Array.isArray(rawSig) ? rawSig[0] : (rawSig as string | null);
    timestamp = Array.isArray(rawTs) ? rawTs[0] : (rawTs as string | null);
  }

  // 1. Check presence of security headers
  if (!signature || !timestamp) {
    return {
      valid: false,
      error: 'REQUEST_INTEGRITY_COMPROMISED',
      code: 4031,
      violationType: 'MISSING_HEADERS',
      details: { receivedSignature: signature || undefined, receivedTimestamp: timestamp || undefined },
    };
  }

  // 2. Check timestamp drift (anti-replay attack)
  const reqTime = parseInt(timestamp, 10);
  const now = Date.now();

  if (isNaN(reqTime)) {
    return {
      valid: false,
      error: 'REQUEST_INTEGRITY_COMPROMISED',
      code: 4031,
      violationType: 'TIMESTAMP_SKEW_EXCEEDED',
      details: { receivedTimestamp: timestamp },
    };
  }

  const drift = Math.abs(now - reqTime);
  if (drift > MAX_DRIFT_MS) {
    return {
      valid: false,
      error: 'REQUEST_INTEGRITY_COMPROMISED',
      code: 4031,
      violationType: 'TIMESTAMP_SKEW_EXCEEDED',
      details: { receivedTimestamp: timestamp, driftMs: drift },
    };
  }

  // 3. Rebuild canonical payload and calculate expected signature
  const canonical = buildCanonicalPayload(normMethod, pathname, timestamp, bodyText);
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(canonical)
    .digest('hex');

  // 4. Constant-time comparison to prevent timing attacks
  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  const receivedBuf = Buffer.from(signature, 'utf8');

  if (
    expectedBuf.length !== receivedBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, receivedBuf)
  ) {
    return {
      valid: false,
      error: 'REQUEST_INTEGRITY_COMPROMISED',
      code: 4031,
      violationType: 'INVALID_SIGNATURE',
      details: { receivedSignature: signature, receivedTimestamp: timestamp },
    };
  }

  return { valid: true };
}

/**
 * Logs tampering attempt to Supabase security_audit_logs
 */
export async function logSecurityCompromise(
  result: VerificationResult,
  metadata: {
    ip?: string;
    userAgent?: string;
    endpoint: string;
    method: string;
    bodySnippet?: string;
  }
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
        ip_address: metadata.ip || 'unknown',
        user_agent: metadata.userAgent || 'unknown',
        endpoint: metadata.endpoint,
        http_method: metadata.method,
        violation_type: result.violationType || 'INVALID_SIGNATURE',
        signature_received: result.details?.receivedSignature,
        timestamp_received: result.details?.receivedTimestamp,
        metadata: {
          drift_ms: result.details?.driftMs,
          body_snippet: metadata.bodySnippet?.slice(0, 200),
        },
      }),
    });
  } catch (err) {
    console.error('Failed to log security compromise:', err);
  }
}
