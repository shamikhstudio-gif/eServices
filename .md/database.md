# مخطط وقواعد بيانات سوبابيس (Supabase Database Schema)
## التركيز الحصري: محرك eLink والمصادقة الموحدة (SSO)

تم تحديث وتطهير قاعدة البيانات وفق التوجيهات الأخيرة؛ حيث تم التركيز الكامل على خدمة **eLink** والحفاظ على نظام الهوية والمصادقة الموحدة (**SSO**).

---

## 1. الجداول المعتمدة والنشطة حالياً (Active Database Tables)

### أ. جدول الحسابات الشخصية والمصادقة الموحدة (`public.profiles`)
يرتبط بالحسابات المسجلة في `auth.users` عبر المشغل الآلي `handle_new_user()`.
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('superadmin', 'admin', 'merchant', 'customer', 'member', 'user')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### ب. جدول الروابط المختصرة الذكية (`public.links`)
محرك الروابط الديناميكية التابع لخدمة `eLink`:
```sql
CREATE TABLE public.links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    short_code TEXT UNIQUE NOT NULL, -- معرف الرابط المختصر بحروف كبيرة وصغيرة وأرقام
    title TEXT NOT NULL,
    destination_url TEXT NOT NULL, -- الوجهة القابلة للتعديل دائماً دون تغيير رمز QR المطبوع
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    block_reason TEXT,
    password_hash TEXT, -- قفل الرابط بكلمة سر
    expires_at TIMESTAMPTZ, -- انتهاء الصلاحية
    max_clicks INTEGER, -- الحد الأقصى للنقرات
    clicks_count INTEGER NOT NULL DEFAULT 0,
    blocked_ips TEXT[] DEFAULT '{}',
    enable_interstitial BOOLEAN NOT NULL DEFAULT false,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    qr_color TEXT NOT NULL DEFAULT '#1A73E8',
    qr_bg_color TEXT NOT NULL DEFAULT '#FFFFFF',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### ج. جدول إحصائيات النقرات والزيارات (`public.link_clicks`)
تسجيل لحظي لكل زيارة أو مسحة لرمز QR لتحليلات eLink:
```sql
CREATE TABLE public.link_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    referer TEXT,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### د. جدول سجلات وتدقيق الأمان السحابي (`public.security_audit_logs`)
توثيق محاولات التلاعب بالبيانات أو الاختراق:
```sql
CREATE TABLE public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    endpoint TEXT NOT NULL,
    http_method TEXT NOT NULL,
    violation_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

## 2. الجداول التي تم حذفها وإسقاطها (Dropped Incoming Tables)
بناءً على طلب المستخدم، تم حذف كافة الجداول التابعة للمشاريع والخدمات القادمة للتركيز الحصري على eLink:
1. `public.store_orders` ✗ (محذوف)
2. `public.monthly_invoices` ✗ (محذوف)
3. `public.stores` ✗ (محذوف)
4. `public.user_services` ✗ (محذوف)
5. `public.services` ✗ (محذوف)
