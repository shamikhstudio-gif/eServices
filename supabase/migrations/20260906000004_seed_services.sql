-- =====================================================================
-- eShamikh Cloud & Services Ecosystem (services.eshamikh.com)
-- Migration 04: Seed Ecosystem Services
-- Author: Principal Cloud Architect & Lead Security Engineer
-- =====================================================================

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
