-- =====================================================================
-- eShamikh Cloud & Services Ecosystem (services.eshamikh.com)
-- Migration 02: Functions & Triggers
-- Author: Principal Cloud Architect & Lead Security Engineer
-- =====================================================================

-- 1. مشغل إنشاء البروفايل التلقائي عند تسجيل مستخدم جديد في auth.users
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    NEW.raw_user_meta_data->>'phone_number',
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. مشغل تحديث الختم الزمني للطلبات تلقائياً عند التعديل
CREATE OR REPLACE FUNCTION public.handle_order_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_updated ON public.orders;
CREATE TRIGGER trg_order_updated
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_update();

-- 3. دالة توليد الفواتير الشهرية الثابتة (25,000 د.ع.) لجميع المتاجر
-- تُستدعى فجر اليوم الأول من كل شهر ميلادي
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
    -- احتساب إجمالي مبيعات الشهر المنصرم لأغراض التقارير الإحصائية
    SELECT 
      COUNT(*),
      COALESCE(SUM(total_amount), 0.00)
    INTO v_delivered_count, v_sales_sum
    FROM public.orders
    WHERE store_id = v_store.id
      AND status = 'DELIVERED'
      AND created_at >= v_prev_month_start
      AND created_at <= (v_prev_month_end + TIME '23:59:59');

    -- إنشاء الفاتورة الشهرية بقيمة الاشتراك الثابت (25,000 د.ع.)
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

-- 4. دالة فحص وتطبيق بروتوكول الحجب الثلاثي (3-Tier Auto-Freeze)
-- تُنفذ يومياً عبر Cron Job لفحص الفواتير المتأخرة
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
    -- حساب الأيام المنقضية بعد انتهاء فترة السماح (يوم 5)
    v_days_overdue := EXTRACT(DAY FROM (now() - v_invoice.grace_period_ends_at))::INTEGER;

    IF v_days_overdue >= 10 THEN -- اليوم 15 من الشهر
      v_target_tier := 3;
      v_new_store_status := 'suspended';
    ELSIF v_days_overdue >= 3 THEN -- اليوم 8 من الشهر
      v_target_tier := 2;
      v_new_store_status := 'dashboard_locked';
    ELSE -- اليوم 6 من الشهر (اليوم الأول بعد انتهاء السماح)
      v_target_tier := 1;
      v_new_store_status := 'checkout_locked';
    END IF;

    -- تطبيق التحديث إذا كان هناك تغيير في مستوى الحظر
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
