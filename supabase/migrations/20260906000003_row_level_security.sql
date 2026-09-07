-- =====================================================================
-- eShamikh Cloud & Services Ecosystem (services.eshamikh.com)
-- Migration 03: Row Level Security (RLS) Policies
-- Author: Principal Cloud Architect & Lead Security Engineer
-- =====================================================================

-- 1. تفعيل RLS على كافة الجداول
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- دالة مساعدة للتحقق مما إذا كان المستخدم مديراً عاماً (SuperAdmin)
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

-- =====================================================================
-- سياسات جدول profiles
-- =====================================================================
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR public.is_superadmin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =====================================================================
-- سياسات جدول services
-- =====================================================================
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services" ON public.services
    FOR SELECT TO anon, authenticated
    USING (is_active = true OR public.is_superadmin());

DROP POLICY IF EXISTS "Superadmin can manage services" ON public.services;
CREATE POLICY "Superadmin can manage services" ON public.services
    FOR ALL TO authenticated
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());

-- =====================================================================
-- سياسات جدول user_services
-- =====================================================================
DROP POLICY IF EXISTS "Users view own services" ON public.user_services;
CREATE POLICY "Users view own services" ON public.user_services
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_superadmin());

DROP POLICY IF EXISTS "Users can subscribe to services" ON public.user_services;
CREATE POLICY "Users can subscribe to services" ON public.user_services
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- سياسات جدول stores
-- =====================================================================
DROP POLICY IF EXISTS "Public can view active stores by slug" ON public.stores;
CREATE POLICY "Public can view active stores by slug" ON public.stores
    FOR SELECT TO anon, authenticated
    USING (status != 'suspended' OR (auth.uid() IS NOT NULL AND auth.uid() = owner_id) OR public.is_superadmin());

DROP POLICY IF EXISTS "Merchants can manage their stores" ON public.stores;
CREATE POLICY "Merchants can manage their stores" ON public.stores
    FOR ALL TO authenticated
    USING (auth.uid() = owner_id OR public.is_superadmin())
    WITH CHECK (auth.uid() = owner_id OR public.is_superadmin());

-- =====================================================================
-- سياسات جدول orders
-- =====================================================================
-- الزبائن يمكنهم إنشاء طلب جديد في المتجر طالما لم يكن في حالة قفل الشراء
DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
CREATE POLICY "Customers can create orders" ON public.orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = store_id 
              AND s.status NOT IN ('checkout_locked', 'suspended')
        )
    );

-- التاجر يقرأ ويعدل طلبات متاجره فقط
DROP POLICY IF EXISTS "Merchants view their store orders" ON public.orders;
CREATE POLICY "Merchants view their store orders" ON public.orders
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stores s 
            WHERE s.id = orders.store_id 
              AND (s.owner_id = auth.uid() OR public.is_superadmin())
        )
    );

DROP POLICY IF EXISTS "Merchants update their store orders" ON public.orders;
CREATE POLICY "Merchants update their store orders" ON public.orders
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stores s 
            WHERE s.id = orders.store_id 
              AND (s.owner_id = auth.uid() OR public.is_superadmin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores s 
            WHERE s.id = orders.store_id 
              AND (s.owner_id = auth.uid() OR public.is_superadmin())
        )
    );

-- =====================================================================
-- سياسات جدول monthly_invoices
-- =====================================================================
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

-- =====================================================================
-- سياسات جدول security_audit_logs
-- =====================================================================
-- السماح للسيرفر والعميل الموثق/المجهول بإضافة سجلات محاولات التلاعب
DROP POLICY IF EXISTS "Allow logging security events" ON public.security_audit_logs;
CREATE POLICY "Allow logging security events" ON public.security_audit_logs
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- القراءة مقتصرة فقط على إدارة الأمان والـ SuperAdmin
DROP POLICY IF EXISTS "Only Superadmin can view security audit logs" ON public.security_audit_logs;
CREATE POLICY "Only Superadmin can view security audit logs" ON public.security_audit_logs
    FOR SELECT TO authenticated
    USING (public.is_superadmin());
