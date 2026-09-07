import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recordLinkClick } from '@/lib/elink';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const enteredPassword = body?.password?.trim();

    if (!enteredPassword) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال كلمة المرور' },
        { status: 400 }
      );
    }

    const { data: link, error } = await supabaseAdmin
      .from('links')
      .select('id, slug, destination_url, is_active, is_blocked, password_hash, expires_at, max_clicks, clicks_count')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !link) {
      return NextResponse.json(
        { success: false, error: 'الرابط غير موجود' },
        { status: 404 }
      );
    }

    if (!link.is_active || link.is_blocked) {
      return NextResponse.json(
        { success: false, error: 'هذا الرابط معطل أو محظور' },
        { status: 403 }
      );
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'انتهت صلاحية هذا الرابط' },
        { status: 410 }
      );
    }

    if (link.max_clicks && (link.clicks_count || 0) >= link.max_clicks) {
      return NextResponse.json(
        { success: false, error: 'تم استنفاذ الحد الأقصى للزيارات لهذا الرابط' },
        { status: 429 }
      );
    }

    if (link.password_hash !== enteredPassword) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى' },
        { status: 401 }
      );
    }

    // Password is correct! Record click
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
    const country = req.headers.get('x-vercel-ip-country') || 'IQ';

    await recordLinkClick(slug, userAgent, rawIp, country);

    return NextResponse.json({
      success: true,
      destination_url: link.destination_url,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في التحقق من كلمة المرور' },
      { status: 500 }
    );
  }
}
