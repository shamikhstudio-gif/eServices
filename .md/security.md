# درع الحماية وتأمين الاتصالات (Anti-Tamper & Security Engine)
## منظومة eShamikh Cloud & Services Ecosystem

---

## 1. مبدأ توقيع الطلبات اللحظي (HMAC Request Signing)

لمنع أي تلاعب بحمولات البيانات الصادرة عبر المتصفح، تُلزم المنظومة جميع طلبات تعديل الحالة (`POST`, `PUT`, `PATCH`, `DELETE`) بحمل توقيع رقمي يتم احتسابه لحظة إرسال الطلب.

### معادلة حساب التوقيع (Canonical Payload)
يتم تكوين السلسلة المعيارية للطلب ثم تشفيرها بمفتاح سري مشترك:

$$\text{CanonicalString} = \text{METHOD} + ":" + \text{PATHNAME} + ":" + \text{TIMESTAMP} + ":" + \text{JSON\_BODY}$$

$$\text{X-Signature} = \text{Hex}(\text{HMAC-SHA256}(\text{HMAC\_SECRET}, \text{CanonicalString}))$$

---

## 2. الترويسات الأمنية الإلزامية (Required Security Headers)

| اسم الترويسة | النوع | المثال | الوظيفة الهندسية |
| :--- | :---: | :--- | :--- |
| `X-Signature` | String (Hex 64 char) | `a3b8c9...d2e1` | ناتج تشفير HMAC-SHA256 للسلسلة المعيارية |
| `X-Timestamp` | String / Integer | `1788712345000` | توقيت الطلب بختم زمني UTC بالميلي ثانية |
| `Content-Type` | String | `application/json` | تحديد نوع المحتوى كـ JSON قياسي |

---

## 3. مواصفات وسيط الفحص في الخادم (Edge/Server Middleware)

قبل وصول أي طلب إلى متحكم الـ Route Handler أو قاعدة البيانات، يقوم الـ Middleware بالخطوات التالية:

### أ. فحص الختم الزمني (Timestamp Drift Check)
- استخراج قيمة `X-Timestamp`.
- حساب الفارق الزمني مع توقيت السيرفر:
  $$\Delta t = |\text{ServerTime} - \text{Timestamp}|$$
- إذا كان $\Delta t > 60,000 \text{ ms}$ (أكثر من 60 ثانية):
  يتم رفض الطلب فوراً لمنع هجمات إعادة الإرسال (Replay Attacks).

### ب. إعادة حساب التوقيع ومقارنته بأمان زمني (Timing-Safe Comparison)
- قراءة جسم الطلب (`req.json()`) ومسار الطلب وميثود الإرسال.
- إعادة تكوين السلسلة المعيارية وحساب الـ HMAC بنفس المفتاح السري للخادم.
- مقارنة التوقيعين باستخدام دالة مقاومة للـ Timing Attacks:
  ```typescript
  import crypto from 'crypto';

  function verifySignature(expected: string, received: string): boolean {
    const expectedBuf = Buffer.from(expected, 'utf8');
    const receivedBuf = Buffer.from(received, 'utf8');
    if (expectedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  }
  ```

---

## 4. بروتوكول الرفض الصارم (Rejection Protocol)

إذا ثبت وجود أي تلاعب في بيانات الطلب، اختلاف في التوقيع، أو انحراف زمني غير مسموح، يُلزم السيرفر بالآتي:
1. إرجاع استجابة سريعة بالرمز `HTTP 403 Forbidden`.
2. إرجاع الجسم الموحد التالي حصراً:
   ```json
   {
     "error": "REQUEST_INTEGRITY_COMPROMISED",
     "code": 4031
   }
   ```
3. تسجيل الواقعة في جدول `security_audit_logs` في قاعدة بيانات Supabase:
   - `ip_address`: عنوان IP الخاص بالعميل.
   - `endpoint`: المسار المستهدف.
   - `violation_type`: نوع المخالفة (`INVALID_SIGNATURE` أو `TIMESTAMP_SKEW_EXCEEDED`).
   - `metadata`: بيانات تفصيلية تشمل الترويسات وهوية المستخدم إن وجدت.

---

## 5. نموذج الشيفرة البرمجية (Implementation Snippets)

### أ. مكتبة التوقيع من طرف العميل (Client Signer)
```typescript
// packages/security-signer/src/index.ts
export async function signRequest(
  method: string,
  pathname: string,
  body: object,
  secretKey: string
): Promise<{ 'X-Signature': string; 'X-Timestamp': string }> {
  const timestamp = Date.now().toString();
  const bodyString = JSON.stringify(body || {});
  const canonicalString = `${method.toUpperCase()}:${pathname}:${timestamp}:${bodyString}`;

  // حساب التشفير عبر Web Crypto API المتوافق مع المتصفحات الحديثة
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(canonicalString)
  );

  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    'X-Signature': signature,
    'X-Timestamp': timestamp,
  };
}
```

### ب. وسيط الفحص في السيرفر (Server Middleware)
```typescript
// apps/hub/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';
import crypto from 'crypto';

const HMAC_SECRET = process.env.HMAC_SECRET_KEY || 'eshamikh_secure_internal_key';

export async function middleware(request: NextRequest) {
  const method = request.method.toUpperCase();

  // فحص الطلبات المعدلة فقط
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const signature = request.headers.get('x-signature');
    const timestamp = request.headers.get('x-timestamp');

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: 'REQUEST_INTEGRITY_COMPROMISED', code: 4031 },
        { status: 403 }
      );
    }

    const now = Date.now();
    const requestTime = parseInt(timestamp, 10);
    if (isNaN(requestTime) || Math.abs(now - requestTime) > 60000) {
      return NextResponse.json(
        { error: 'REQUEST_INTEGRITY_COMPROMISED', code: 4031 },
        { status: 403 }
      );
    }

    const bodyText = await request.clone().text();
    const pathname = request.nextUrl.pathname;
    const canonical = `${method}:${pathname}:${timestamp}:${bodyText || '{}'}`;

    const expectedSig = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(canonical)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    const receivedBuf = Buffer.from(signature, 'utf8');

    if (
      expectedBuf.length !== receivedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, receivedBuf)
    ) {
      // توثيق في سجل الأمان ثم الرفض
      return NextResponse.json(
        { error: 'REQUEST_INTEGRITY_COMPROMISED', code: 4031 },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}
```
