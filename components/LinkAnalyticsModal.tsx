'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  X, 
  BarChart3, 
  Globe, 
  Laptop, 
  Clock, 
  Loader2, 
  Hash,
  ShieldCheck
} from 'lucide-react';

interface LinkAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: {
    id: string;
    slug: string;
    title?: string | null;
    destination_url: string;
    clicks_count: number;
    created_at: string;
  } | null;
}

interface ClickRecord {
  id: string;
  link_slug: string;
  ip_hash: string | null;
  user_agent: string | null;
  country: string | null;
  created_at: string;
}

export default function LinkAnalyticsModal({
  isOpen,
  onClose,
  link,
}: LinkAnalyticsModalProps) {
  const [clicks, setClicks] = useState<ClickRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (!isOpen || !link) return;

    setLoading(true);
    supabase
      .from('link_clicks')
      .select('*')
      .eq('link_slug', link.slug)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) {
          setClicks(data);
        }
        setLoading(false);
      });
  }, [isOpen, link]);

  if (!isOpen || !link) return null;

  function parseDevice(ua: string | null): string {
    if (!ua) return 'متصفح ويب';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS / Apple';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Macintosh')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    return 'جهاز ويب';
  }

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div 
        className="settings-modal-box" 
        onClick={e => e.stopPropagation()} 
        dir="rtl"
        style={{ maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="settings-modal-header">
          <div className="settings-modal-title-wrap">
            <div className="settings-modal-icon-badge">
              <BarChart3 size={19} />
            </div>
            <div>
              <h2 className="settings-modal-title">إحصائيات وتحليلات الزيارات (Analytics)</h2>
              <p className="settings-modal-sub">
                سجل النقرات ومسحات رمز الـ QR للرابط <code>{link.slug}</code>
              </p>
            </div>
          </div>
          <button className="settings-modal-close-btn" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        {/* Ticker Row */}
        <div className="analytics-ticker-row">
          <div className="analytics-metric-box">
            <span className="analytics-metric-num">{link.clicks_count || 0}</span>
            <span className="analytics-metric-label">إجمالي النقرات والمسحات</span>
          </div>
          <div className="analytics-metric-box">
            <span className="analytics-metric-num">{clicks.length}</span>
            <span className="analytics-metric-label">آخر زيارات مسجلة</span>
          </div>
          <div className="analytics-metric-box">
            <span className="analytics-metric-num">
              {new Date(link.created_at).toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric' })}
            </span>
            <span className="analytics-metric-label">تاريخ إنشاء الرابط</span>
          </div>
        </div>

        {/* Clicks Log Table */}
        <div className="analytics-log-container">
          <div className="analytics-log-head">
            <span>سجل النقرات الأخيرة (أحدث 50 زيارة)</span>
            <span className="analytics-gdpr-tag">
              <ShieldCheck size={11} />
              خصوصية مشفرة (GDPR Hashed IP)
            </span>
          </div>

          {loading ? (
            <div className="analytics-loading-box">
              <Loader2 size={24} className="spin" />
              <span>جاري استرجاع سجل الزيارات السحابي...</span>
            </div>
          ) : clicks.length === 0 ? (
            <div className="analytics-empty-box">
              <BarChart3 size={36} />
              <h4>لا توجد نقرات مسجلة بعد</h4>
              <p>شارك الرابط أو اطبع رمز الـ QR لبدء رصد التحليلات اللحظية للزوار.</p>
            </div>
          ) : (
            <div className="analytics-table-wrap">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>توقيت الزيارة</th>
                    <th>الجهاز / النظام</th>
                    <th>الدولة</th>
                    <th>بصمة الـ IP</th>
                  </tr>
                </thead>
                <tbody>
                  {clicks.map(c => (
                    <tr key={c.id}>
                      <td className="time-col">
                        <Clock size={11} />
                        <span>
                          {new Date(c.created_at).toLocaleString('ar-IQ', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="device-col">
                        <Laptop size={11} />
                        <span>{parseDevice(c.user_agent)}</span>
                      </td>
                      <td className="country-col">
                        <Globe size={11} />
                        <span>{c.country || 'العراق'}</span>
                      </td>
                      <td className="hash-col" dir="ltr">
                        <code>{c.ip_hash || 'anon'}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="settings-modal-footer">
          <button className="elink-secondary-btn" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
