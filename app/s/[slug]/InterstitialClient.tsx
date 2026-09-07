'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, ShieldCheck, ArrowLeft } from 'lucide-react';

interface InterstitialProps {
  slug: string;
  destinationUrl: string;
  title: string;
}

export default function InterstitialRedirectClient({
  slug,
  destinationUrl,
  title,
}: InterstitialProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown <= 0) {
      window.location.href = destinationUrl;
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, destinationUrl]);

  let domain = 'الوجهة الخارجية';
  try {
    domain = new URL(destinationUrl).hostname;
  } catch {}

  return (
    <div className="sso-public-screen">
      <div className="sso-public-card">
        <div className="sso-public-icon-box safe">
          <ShieldCheck size={30} />
        </div>

        <span className="sso-public-badge safe">
          فحص الأمان الاستباقي
        </span>

        <h1 className="sso-public-title">أنت على وشك مغادرة المنصة</h1>
        <p className="sso-public-desc">
          الرابط المختصر <strong>&quot;{title}&quot;</strong> يوجهك إلى الموقع الخارجي المعتمد أدناه:
        </p>

        <div className="sso-destination-pill" dir="ltr">
          <ExternalLink size={13} />
          <span>{domain}</span>
        </div>

        <div className="sso-countdown-circle">
          <span className="countdown-num">{countdown}</span>
          <span className="countdown-label">ثوانٍ للتحويل التلقائي</span>
        </div>

        <button
          onClick={() => (window.location.href = destinationUrl)}
          className="sso-public-btn primary"
        >
          <span>المتابعة فوراً دون انتظار</span>
          <ArrowLeft size={15} />
        </button>

        <div className="sso-public-meta">
          <span>الرمز: <code>{slug}</code></span>
          <span>eLink Safe Browsing</span>
        </div>
      </div>
    </div>
  );
}
