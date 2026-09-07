'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

interface PasswordClientProps {
  slug: string;
  title: string;
}

export default function PasswordProtectedClient({ slug, title }: PasswordClientProps) {
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/s/${slug}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'كلمة المرور غير صحيحة');
        setLoading(false);
        return;
      }

      // Success -> Redirect to target URL
      window.location.href = data.destination_url;
    } catch (err: any) {
      setError('تعذر الاتصال بالخادم للتحقق من الرمز');
      setLoading(false);
    }
  }

  return (
    <div className="sso-public-screen">
      <div className="sso-public-card">
        <div className="sso-public-icon-box lock">
          <Lock size={30} />
        </div>

        <span className="sso-public-badge protected">
          <ShieldCheck size={12} />
          حماية مشفرة
        </span>

        <h1 className="sso-public-title">هذا الرابط محمي برمز أمان</h1>
        <p className="sso-public-desc">
          الرابط <strong>&quot;{title}&quot;</strong> يتطلب كلمة مرور مخصصة لفك التشفير والمتابعة إلى الوجهة.
        </p>

        {error && (
          <div className="sso-public-alert">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="sso-public-form">
          <div className="sso-input-row">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="أدخل رمز المرور..."
              className="sso-public-input"
              dir="ltr"
              autoFocus
              required
            />
            <button
              type="button"
              className="sso-eye-btn"
              onClick={() => setShowPass(!showPass)}
              title={showPass ? 'إخفاء' : 'إظهار'}
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <button
            type="submit"
            className="sso-public-btn primary"
            disabled={loading || !password.trim()}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="spin" />
                <span>جاري فك التشفير...</span>
              </>
            ) : (
              <>
                <span>تأكيد والدخول للرابط</span>
                <ArrowLeft size={15} />
              </>
            )}
          </button>
        </form>

        <div className="sso-public-meta">
          <span>الرمز المختصر: <code>{slug}</code></span>
          <span>eLink Cloud Security Shield</span>
        </div>

        <Link href="/" className="sso-public-cancel-link">
          إلغاء والعودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
