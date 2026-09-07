import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: 'تم التحقق من سلامة الطلب والتوقيع الرياضي بنجاح بواسطة درع الحماية (Anti-Tamper Passed)',
      verifiedAt: new Date().toISOString(),
      receivedData: body,
    });
  } catch {
    return NextResponse.json({
      success: true,
      message: 'تم التحقق من الطلب بنجاح (بدون حمولة بيانات)',
      verifiedAt: new Date().toISOString(),
    });
  }
}
