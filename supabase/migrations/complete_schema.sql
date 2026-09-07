-- =====================================================================
-- eShamikh Cloud & Services Ecosystem (services.eshamikh.com)
-- Complete Unified Database Migration Script
-- Applied directly to Supabase project
-- Contains: Profiles, Services, User Services, Stores, Store Orders, Monthly Invoices, Security Logs
-- =====================================================================

-- 1. جدول الحسابات والملفات الشخصية (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('superadmin', 'merchant', 'customer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. جدول الخدمات المركزية (Services)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. جدول اشتراكات المستخدمين في الأدوات (User Services)
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
    slug TEXT UNIQUE NOT NULL,
    monthly_subscription_fee NUMERIC(10,2) NOT NULL DEFAULT 25000.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'checkout_locked', 'dashboard_locked', 'suspended')),
    qi_card_account TEXT,
    logo_url TEXT,
    settings JSONB DEFAULT '{"allow_cash_on_delivery": true, "enable_etrack": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. جدول طلبات ومبيعات المتاجر (Store Orders)
CREATE TABLE IF NOT EXISTS public.store_orders (
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
    billing_month DATE NOT NULL,
    total_delivered_orders INTEGER NOT NULL DEFAULT 0,
    total_sales_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    amount_due NUMERIC(10,2) NOT NULL DEFAULT 25000.00,
    grace_period_ends_at TIMESTAMPTZ NOT NULL,
    freeze_tier SMALLINT NOT NULL DEFAULT 0 CHECK (freeze_tier IN (0, 1, 2, 3)),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'UNDER_REVIEW', 'OVERDUE')),
    qi_transaction_ref TEXT UNIQUE,
    receipt_url TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_store_billing_month UNIQUE(store_id, billing_month)
);

-- 7. جدول سجلات وتدقيق الأمان (Security Audit Logs)
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    endpoint TEXT NOT NULL,
    http_method TEXT NOT NULL,
    violation_type TEXT NOT NULL,
    signature_received TEXT,
    timestamp_received TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. الفهارس (Indexes)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_services_user_id ON public.user_services(user_id);
CREATE INDEX IF NOT EXISTS idx_user_services_service_id ON public.user_services(service_id);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);
CREATE INDEX IF NOT EXISTS idx_store_orders_store_id ON public.store_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON public.store_orders(status);
CREATE INDEX IF NOT EXISTS idx_store_orders_tracking ON public.store_orders(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_store_id ON public.monthly_invoices(store_id);
CREATE INDEX IF NOT EXISTS idx_invoices_billing_month ON public.monthly_invoices(billing_month);
CREATE INDEX IF NOT EXISTS idx_security_logs_violation ON public.security_audit_logs(violation_type);

-- 9. المشغلات والدوال (Functions & Triggers)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone_number',
    CASE 
      WHEN NEW.email IN ('shamikhstudio@gmail.com', 'admin@eshamikh.com') THEN 'superadmin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'merchant')
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = CASE 
      WHEN NEW.email IN ('shamikhstudio@gmail.com', 'admin@eshamikh.com') THEN 'superadmin'
      ELSE profiles.role
    END,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_order_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_store_order_updated ON public.store_orders;
CREATE TRIGGER trg_store_order_updated
  BEFORE UPDATE ON public.store_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_update();

CREATE OR REPLACE FUNCTION public.generate_monthly_invoices(target_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store RECORD;
  v_invoices_created INTEGER := 0;
  v_delivered_count INTEGER;
  v_sales_sum NUMERIC(12,2);
  v_prev_month_start DATE := (target_month - INTERVAL '1 month')::DATE;
  v_prev_month_end DATE := (target_month - INTERVAL '1 day')::DATE;
  v_grace_ends TIMESTAMPTZ := (target_month + INTERVAL '5 days 23 hours 59 minutes 59 seconds');
BEGIN
  FOR v_store IN 
    SELECT id, monthly_subscription_fee 
    FROM public.stores 
    WHERE status != 'suspended'
  LOOP
    SELECT 
      COUNT(*),
      COALESCE(SUM(total_amount), 0.00)
    INTO v_delivered_count, v_sales_sum
    FROM public.store_orders
    WHERE store_id = v_store.id
      AND status = 'DELIVERED'
      AND created_at >= v_prev_month_start
      AND created_at <= (v_prev_month_end + TIME '23:59:59');

    INSERT INTO public.monthly_invoices (
      store_id,
      billing_month,
      total_delivered_orders,
      total_sales_amount,
      amount_due,
      grace_period_ends_at,
      freeze_tier,
      status
    )
    VALUES (
      v_store.id,
      target_month,
      v_delivered_count,
      v_sales_sum,
      v_store.monthly_subscription_fee,
      v_grace_ends,
      0,
      'PENDING'
    )
    ON CONFLICT (store_id, billing_month) DO NOTHING;

    IF FOUND THEN
      v_invoices_created := v_invoices_created + 1;
    END IF;
  END LOOP;

  RETURN v_invoices_created;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_auto_freeze_protocol()
RETURNS TABLE (store_id UUID, old_status TEXT, new_status TEXT, tier SMALLINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_days_overdue INTEGER;
  v_target_tier SMALLINT;
  v_new_store_status TEXT;
BEGIN
  FOR v_invoice IN 
    SELECT i.id AS invoice_id, i.store_id, i.grace_period_ends_at, i.freeze_tier, s.status AS current_store_status
    FROM public.monthly_invoices i
    JOIN public.stores s ON s.id = i.store_id
    WHERE i.status IN ('PENDING', 'OVERDUE')
      AND now() > i.grace_period_ends_at
  LOOP
    v_days_overdue := EXTRACT(DAY FROM (now() - v_invoice.grace_period_ends_at))::INTEGER;

    IF v_days_overdue >= 10 THEN
      v_target_tier := 3;
      v_new_store_status := 'suspended';
    ELSIF v_days_overdue >= 3 THEN
      v_target_tier := 2;
      v_new_store_status := 'dashboard_locked';
    ELSE
      v_target_tier := 1;
      v_new_store_status := 'checkout_locked';
    END IF;

    IF v_invoice.freeze_tier < v_target_tier THEN
      UPDATE public.monthly_invoices
      SET 
        freeze_tier = v_target_tier,
        status = 'OVERDUE',
        updated_at = timezone('utc'::text, now())
      WHERE id = v_invoice.invoice_id;

      UPDATE public.stores
      SET 
        status = v_new_store_status,
        updated_at = timezone('utc'::text, now())
      WHERE id = v_invoice.store_id;

      store_id := v_invoice.store_id;
      old_status := v_invoice.current_store_status;
      new_status := v_new_store_status;
      tier := v_target_tier;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- 10. سياسات الأمان RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR public.is_superadmin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services" ON public.services
    FOR SELECT TO anon, authenticated
    USING (is_active = true OR public.is_superadmin());

DROP POLICY IF EXISTS "Superadmin can manage services" ON public.services;
CREATE POLICY "Superadmin can manage services" ON public.services
    FOR ALL TO authenticated
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS "Users view own services" ON public.user_services;
CREATE POLICY "Users view own services" ON public.user_services
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_superadmin());

DROP POLICY IF EXISTS "Users can subscribe to services" ON public.user_services;
CREATE POLICY "Users can subscribe to services" ON public.user_services
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view active stores by slug" ON public.stores;
CREATE POLICY "Public can view active stores by slug" ON public.stores
    FOR SELECT TO anon, authenticated
    USING (status != 'suspended' OR (auth.uid() IS NOT NULL AND auth.uid() = owner_id) OR public.is_superadmin());

DROP POLICY IF EXISTS "Merchants can manage their stores" ON public.stores;
CREATE POLICY "Merchants can manage their stores" ON public.stores
    FOR ALL TO authenticated
    USING (auth.uid() = owner_id OR public.is_superadmin())
    WITH CHECK (auth.uid() = owner_id OR public.is_superadmin());

DROP POLICY IF EXISTS "Customers can create orders" ON public.store_orders;
CREATE POLICY "Customers can create orders" ON public.store_orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = store_id 
              AND s.status NOT IN ('checkout_locked', 'suspended')
        )
    );

DROP POLICY IF EXISTS "Merchants view their store orders" ON public.store_orders;
CREATE POLICY "Merchants view their store orders" ON public.store_orders
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stores s 
            WHERE s.id = store_orders.store_id 
              AND (s.owner_id = auth.uid() OR public.is_superadmin())
        )
    );

DROP POLICY IF EXISTS "Merchants update their store orders" ON public.store_orders;
CREATE POLICY "Merchants update their store orders" ON public.store_orders
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stores s 
            WHERE s.id = store_orders.store_id 
              AND (s.owner_id = auth.uid() OR public.is_superadmin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores s 
            WHERE s.id = store_orders.store_id 
              AND (s.owner_id = auth.uid() OR public.is_superadmin())
        )
    );

DROP POLICY IF EXISTS "Merchants view their invoices" ON public.monthly_invoices;
CREATE POLICY "Merchants view their invoices" ON public.monthly_invoices
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stores s 
            WHERE s.id = monthly_invoices.store_id 
              AND (s.owner_id = auth.uid() OR public.is_superadmin())
        )
    );

DROP POLICY IF EXISTS "Merchants submit Qi Card settlement" ON public.monthly_invoices;
CREATE POLICY "Merchants submit Qi Card settlement" ON public.monthly_invoices
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stores s 
            WHERE s.id = monthly_invoices.store_id 
              AND s.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores s 
            WHERE s.id = monthly_invoices.store_id 
              AND s.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow logging security events" ON public.security_audit_logs;
CREATE POLICY "Allow logging security events" ON public.security_audit_logs
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Only Superadmin can view security audit logs" ON public.security_audit_logs;
CREATE POLICY "Only Superadmin can view security audit logs" ON public.security_audit_logs
    FOR SELECT TO authenticated
    USING (public.is_superadmin());

-- 11. البيانات الأولية للخدمات (Seed Services)
INSERT INTO public.services (slug, name, description, icon_name, is_active)
VALUES
    (
        'estore',
        'eStore — منصة المتاجر للشركاء',
        'تمكين التجار من إنشاء متاجر إلكترونية احترافية بنطاقات فرعية مع نظام إدارة طلبات متكامل وفوترة ثابتة 25,000 د.ع. شهرياً.',
        'ShoppingBag',
        true
    ),
    (
        'etrack',
        'eTrack — محرك التتبع الذكي',
        'منصة تتبع شحنات ولوجستيات آنية توفر رمز تتبع موحد وواجهة استعلام شفافة للعملاء والشركاء في العراق.',
        'Truck',
        true
    ),
    (
        'eform',
        'eForm — صانع النماذج الديناميكية',
        'أداة لبناء استمارات التسجيل، طلبات الشراء المخصصة، واستطلاعات الرأي مع التحقق الفوري من البيانات.',
        'FileText',
        true
    ),
    (
        'elink',
        'eLink — اختصار الروابط والتحليلات',
        'إدارة الروابط التسويقية وتوليد رموز الاستجابة السريعة (QR Code) مع تتبع جغرافي دقيق لمصادر الزيارات.',
        'Link2',
        true
    )
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    is_active = EXCLUDED.is_active;
