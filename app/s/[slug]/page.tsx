import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { recordLinkClick } from '@/lib/elink';
import InterstitialRedirectClient from './InterstitialClient';
import PasswordProtectedClient from './PasswordClient';
import { 
  ShieldAlert, 
  Clock, 
  Users, 
  ExternalLink, 
  ArrowLeft,
  ShieldCheck 
} from 'lucide-react';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShortLinkRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  const headersList = await headers();

  const userAgent = headersList.get('user-agent') || 'Unknown';
  const rawIp = headersList.get('x-forwarded-for')?.split(',')[0] || headersList.get('x-real-ip') || '127.0.0.1';
  const country = headersList.get('x-vercel-ip-country') || 'IQ';

  // Fetch link data
  const { data: link, error } = await supabaseAdmin
    .from('links')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !link) {
    notFound();
  }

  // 1. Check if blocked or deactivated
  if (!link.is_active || link.is_blocked) {
    return (
      <div className="sso-public-screen">
        <div className="sso-public-card">
          <div className="sso-public-icon-box danger">
            <ShieldAlert size={32} />
          </div>
          <span className="sso-public-badge danger">رابط غير متاح</span>
          <h1 className="sso-public-title">تم تعطيل أو حظر هذا الرابط</h1>
          <p className="sso-public-desc">
            {link.block_reason || 'تم إيقاف تشغيل هذا الرابط مؤقتاً من قبل المالك أو إدارة المنظومة السحابية.'}
          </p>
          <div className="sso-public-meta">
            <span>الرمز المختصر: <code>{slug}</code></span>
            <span>نظام الحماية السحابي eLink</span>
          </div>
          <Link href="/" className="sso-public-btn">
            <span>العودة إلى بوابة eShamikh</span>
            <ArrowLeft size={15} />
          </Link>
        </div>
      </div>
    );
  }

  // 2. Check if expired
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    const expiredDate = new Date(link.expires_at).toLocaleString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div className="sso-public-screen">
        <div className="sso-public-card">
          <div className="sso-public-icon-box warning">
            <Clock size={32} />
          </div>
          <span className="sso-public-badge warning">صلاحية منتهية</span>
          <h1 className="sso-public-title">انتهت صلاحية هذا الرابط</h1>
          <p className="sso-public-desc">
            تمت برمجة هذا الرابط الذكي لينتهي تلقائياً بتاريخ: {expiredDate}.
          </p>
          <div className="sso-public-meta">
            <span>الرمز المختصر: <code>{slug}</code></span>
            <span>انتهت فترة العرض المحددة</span>
          </div>
          <Link href="/" className="sso-public-btn">
            <span>العودة إلى بوابة eShamikh</span>
            <ArrowLeft size={15} />
          </Link>
        </div>
      </div>
    );
  }

  // 3. Check if max clicks reached
  if (link.max_clicks && (link.clicks_count || 0) >= link.max_clicks) {
    return (
      <div className="sso-public-screen">
        <div className="sso-public-card">
          <div className="sso-public-icon-box warning">
            <Users size={32} />
          </div>
          <span className="sso-public-badge warning">سقف الزيارات</span>
          <h1 className="sso-public-title">تم استنفاذ الحد الأقصى للزيارات</h1>
          <p className="sso-public-desc">
            وصل هذا الرابط إلى الحد الأقصى للنقرات المسموح به من قِبل منشئه ({link.max_clicks} زيارة).
          </p>
          <div className="sso-public-meta">
            <span>الرمز المختصر: <code>{slug}</code></span>
            <span>اكتمال سقف الزيارات المخصص</span>
          </div>
          <Link href="/" className="sso-public-btn">
            <span>العودة إلى بوابة eShamikh</span>
            <ArrowLeft size={15} />
          </Link>
        </div>
      </div>
    );
  }

  // 4. Password Protection
  if (link.password_hash) {
    return (
      <PasswordProtectedClient 
        slug={slug} 
        title={link.title || 'رابط ذكي محمي'} 
      />
    );
  }

  // 5. Safe Browsing Interstitial Countdown
  if (link.enable_interstitial) {
    // Record click before showing countdown
    await recordLinkClick(slug, userAgent, rawIp, country);
    return (
      <InterstitialRedirectClient 
        slug={slug}
        destinationUrl={link.destination_url}
        title={link.title || slug}
      />
    );
  }

  // 6. Direct Immediate Redirection
  await recordLinkClick(slug, userAgent, rawIp, country);
  redirect(link.destination_url);
}
