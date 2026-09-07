'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Store } from 'lucide-react';

export default function ServicesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/estore/dashboard');
  }, [router]);

  return (
    <div className="white-app-container flex items-center justify-center" dir="rtl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#09090B', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Store size={24} />
        </div>
        <Loader2 size={24} className="spin" color="#18181B" />
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#09090B', margin: '0 0 4px 0' }}>
            تم نقل المنظومة بالكامل إلى متجر eStore
          </h2>
          <span style={{ fontSize: '12.5px', color: '#71717A' }}>
            جاري تحويلك تلقائياً إلى لوحة التحكم (estore.eshamikh.com)...
          </span>
        </div>
      </div>
    </div>
  );
}
