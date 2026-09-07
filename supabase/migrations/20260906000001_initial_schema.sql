-- =====================================================================
-- eShamikh Cloud & Services Ecosystem (services.eshamikh.com)
-- Migration 01: Initial Schema (Tables & Indexes)
-- Author: Principal Cloud Architect & Lead Security Engineer
-- =====================================================================

-- 1. جدول الحسابات الشخصية (Profiles)
-- يرتبط بحسابات auth.users في Supabase
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('superadmin', 'merchant', 'customer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. جدول الخدمات السحابية المركزية (Services)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL, -- 'estore', 'etrack', 'eform', 'elink'
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. جدول اشتراكات وصلاحيات المستخدمين في الأدوات (User Services)
CREATE TABLE IF NOT EXISTS public.user_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_service UNIQUE(user_id, service_id)
);

-- 4. جدول المتاجر الإلكترونية للشركاء (Stores)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- e.g. baghdad-store -> baghdad-store.estore.eshamikh.com
    monthly_subscription_fee NUMERIC(10,2) NOT NULL DEFAULT 25000.00, -- اشتراك شهري ثابت 25,000 د.ع.
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'checkout_locked', 'dashboard_locked', 'suspended')),
    qi_card_account TEXT, -- رقم المحفظة / الحساب في كي كارد
    logo_url TEXT,
    settings JSONB DEFAULT '{"allow_cash_on_delivery": true, "enable_etrack": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. جدول طلبات الشراء والمبيعات (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'RETURNED', 'CANCELLED')),
    tracking_number TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_store_order UNIQUE(store_id, order_number)
);

-- 6. جدول الفواتير الشهرية وتسوية كي كارد (Monthly Invoices)
CREATE TABLE IF NOT EXISTS public.monthly_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    billing_month DATE NOT NULL, -- بداية الشهر المستحق e.g. '2026-09-01'
    total_delivered_orders INTEGER NOT NULL DEFAULT 0,
    total_sales_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    amount_due NUMERIC(10,2) NOT NULL DEFAULT 25000.00, -- الرسم الثابت 25,000 د.ع. لـ eShamikh
    grace_period_ends_at TIMESTAMPTZ NOT NULL, -- اليوم الخامس من الشهر (23:59:59 UTC)
    freeze_tier SMALLINT NOT NULL DEFAULT 0 CHECK (freeze_tier IN (0, 1, 2, 3)),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'UNDER_REVIEW', 'OVERDUE')),
    qi_transaction_ref TEXT UNIQUE, -- رقم إشعار التحويل من كي كارد
    receipt_url TEXT, -- رابط صورة الوصل المرفوعة
    reviewed_by UUID REFERENCES public.profiles(id),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_store_billing_month UNIQUE(store_id, billing_month)
);

-- 7. جدول تدقيق وسجلات الأمان ومنع التلاعب (Security Audit Logs)
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    endpoint TEXT NOT NULL,
    http_method TEXT NOT NULL,
    violation_type TEXT NOT NULL, -- 'INVALID_SIGNATURE', 'TIMESTAMP_SKEW_EXCEEDED', 'UNAUTHORIZED_ACCESS'
    signature_received TEXT,
    timestamp_received TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =====================================================================
-- الفهارس الذكية لتحسين الأداء وتسريع الاستعلامات (Performance Indexes)
-- =====================================================================

-- فهارس profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- فهارس user_services
CREATE INDEX IF NOT EXISTS idx_user_services_user_id ON public.user_services(user_id);
CREATE INDEX IF NOT EXISTS idx_user_services_service_id ON public.user_services(service_id);
CREATE INDEX IF NOT EXISTS idx_user_services_status ON public.user_services(status);

-- فهارس stores
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);

-- فهارس orders
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON public.orders(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- فهارس monthly_invoices
CREATE INDEX IF NOT EXISTS idx_invoices_store_id ON public.monthly_invoices(store_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.monthly_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_billing_month ON public.monthly_invoices(billing_month);
CREATE INDEX IF NOT EXISTS idx_invoices_freeze_tier ON public.monthly_invoices(freeze_tier);

-- فهارس security_audit_logs
CREATE INDEX IF NOT EXISTS idx_security_logs_violation ON public.security_audit_logs(violation_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON public.security_audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_audit_logs(created_at DESC);
