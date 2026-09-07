'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Clock, 
  Users, 
  ShieldAlert, 
  Check, 
  Loader2, 
  AlertCircle,
  Eye,
  EyeOff,
  Sliders,
  ExternalLink
} from 'lucide-react';

interface LinkProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: {
    id: string;
    slug: string;
    is_active: boolean;
    is_blocked: boolean;
    block_reason?: string | null;
    password_hash?: string | null;
    expires_at?: string | null;
    max_clicks?: number | null;
    enable_interstitial: boolean;
  } | null;
  onUpdated: (changes: any) => void;
}

export default function LinkProtectionModal({
  isOpen,
  onClose,
  link,
  onUpdated,
}: LinkProtectionModalProps) {
  const [isActive, setIsActive] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');

  const [hasMaxClicks, setHasMaxClicks] = useState(false);
  const [maxClicks, setMaxClicks] = useState<number | ''>('');

  const [interstitial, setInterstitial] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (link) {
      setIsActive(link.is_active ?? true);
      setIsBlocked(link.is_blocked ?? false);
      setBlockReason(link.block_reason || '');

      setHasPassword(Boolean(link.password_hash));
      setPassword(link.password_hash || '');

      setHasExpiry(Boolean(link.expires_at));
      if (link.expires_at) {
        // Format to YYYY-MM-DDTHH:mm for datetime-local
        try {
          const d = new Date(link.expires_at);
          const formatted = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setExpiryDate(formatted);
        } catch {
          setExpiryDate('');
        }
      } else {
        setExpiryDate('');
      }

      setHasMaxClicks(Boolean(link.max_clicks));
      setMaxClicks(link.max_clicks || '');

      setInterstitial(link.enable_interstitial ?? false);
      setError(null);
    }
  }, [link]);

  if (!isOpen || !link) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!link) return;
    setError(null);

    // Validation
    if (hasPassword && !password.trim()) {
      setError('يرجى كتابة كلمة المرور للرابط أو إيقاف تفعيل خيار الحماية برمز');
      return;
    }

    if (hasExpiry && !expiryDate) {
      setError('يرجى تحديد تاريخ ووقت انتهاء الصلاحية أو إيقاف خيار الجدولة');
      return;
    }

    if (hasMaxClicks && (!maxClicks || Number(maxClicks) <= 0)) {
      setError('يرجى تحديد سقف نقرات أكبر من صفر');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        is_active: isActive,
        is_blocked: isBlocked,
        block_reason: isBlocked ? (blockReason.trim() || 'الرابط معطل حالياً') : null,
        password_hash: hasPassword ? password.trim() : null,
        expires_at: hasExpiry && expiryDate ? new Date(expiryDate).toISOString() : null,
        max_clicks: hasMaxClicks && maxClicks ? Number(maxClicks) : null,
        enable_interstitial: interstitial,
        updated_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from('links')
        .update(payload)
        .eq('id', link.id);

      if (dbError) throw dbError;

      onUpdated(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل تحديث قواعد الحماية');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div 
        className="settings-modal-box" 
        onClick={e => e.stopPropagation()} 
        dir="rtl"
        style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="settings-modal-header">
          <div className="settings-modal-title-wrap">
            <div className="settings-modal-icon-badge">
              <ShieldCheck size={19} />
            </div>
            <div>
              <h2 className="settings-modal-title">قواعد الأمان والتحكم المتقدم</h2>
              <p className="settings-modal-sub">
                تخصيص سياسات الوصول والحماية للرابط <code>{link.slug}</code>
              </p>
            </div>
          </div>
          <button className="settings-modal-close-btn" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="elink-modal-form">
          {error && (
            <div className="settings-msg error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Kill Switch / Block Toggle */}
          <div className="protection-rule-card">
            <div className="protection-rule-header">
              <div className="protection-rule-icon danger">
                <ShieldAlert size={18} />
              </div>
              <div className="protection-rule-info">
                <div className="protection-rule-title">مفتاح الحظر والتعطيل الفوري (Kill Switch)</div>
                <div className="protection-rule-desc">إيقاف الرابط فورياً وتوجيه الزوار لصفحة توقف مخصصة</div>
              </div>
              <button
                type="button"
                className={`settings-interactive-switch ${isBlocked ? 'on' : 'off'}`}
                onClick={() => setIsBlocked(!isBlocked)}
              >
                <div className="switch-knob" />
              </button>
            </div>

            {isBlocked && (
              <div className="protection-rule-details">
                <label>سبب الحجب المعروض للزوار (اختياري)</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  placeholder="مثال: الرابط متوقف مؤقتاً لأعمال الصيانة والتحديثات"
                  className="settings-input"
                />
              </div>
            )}
          </div>

          {/* 2. Password Protection */}
          <div className="protection-rule-card">
            <div className="protection-rule-header">
              <div className="protection-rule-icon lock">
                <Lock size={18} />
              </div>
              <div className="protection-rule-info">
                <div className="protection-rule-title">قفل الرابط بكلمة مرور (Password)</div>
                <div className="protection-rule-desc">مطالبة الزائر بإدخال رمز أمان قبل فك التشفير والتحويل</div>
              </div>
              <button
                type="button"
                className={`settings-interactive-switch ${hasPassword ? 'on' : 'off'}`}
                onClick={() => setHasPassword(!hasPassword)}
              >
                <div className="switch-knob" />
              </button>
            </div>

            {hasPassword && (
              <div className="protection-rule-details">
                <label>كلمة المرور المطلوبة</label>
                <div className="settings-input-with-icon">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور..."
                    className="settings-input"
                    dir="ltr"
                    required={hasPassword}
                  />
                  <button
                    type="button"
                    className="settings-eye-btn"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Expiration Date */}
          <div className="protection-rule-card">
            <div className="protection-rule-header">
              <div className="protection-rule-icon time">
                <Clock size={18} />
              </div>
              <div className="protection-rule-info">
                <div className="protection-rule-title">جدولة انتهاء الصلاحية (Expiration)</div>
                <div className="protection-rule-desc">إيقاف عمل الرابط تلقائياً بعد حلول وقت وتاريخ محدد</div>
              </div>
              <button
                type="button"
                className={`settings-interactive-switch ${hasExpiry ? 'on' : 'off'}`}
                onClick={() => setHasExpiry(!hasExpiry)}
              >
                <div className="switch-knob" />
              </button>
            </div>

            {hasExpiry && (
              <div className="protection-rule-details">
                <label>تاريخ وساعة الانتهاء</label>
                <input
                  type="datetime-local"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="settings-input"
                  dir="ltr"
                  required={hasExpiry}
                />
              </div>
            )}
          </div>

          {/* 4. Click Quota Limit */}
          <div className="protection-rule-card">
            <div className="protection-rule-header">
              <div className="protection-rule-icon quota">
                <Users size={18} />
              </div>
              <div className="protection-rule-info">
                <div className="protection-rule-title">سقف النقرات الأقصى (Click Quota)</div>
                <div className="protection-rule-desc">تحديد عدد أقصى للنقرات (مثال: لأول 100 زائر فقط)</div>
              </div>
              <button
                type="button"
                className={`settings-interactive-switch ${hasMaxClicks ? 'on' : 'off'}`}
                onClick={() => setHasMaxClicks(!hasMaxClicks)}
              >
                <div className="switch-knob" />
              </button>
            </div>

            {hasMaxClicks && (
              <div className="protection-rule-details">
                <label>الحد الأقصى للزيارات</label>
                <input
                  type="number"
                  min="1"
                  value={maxClicks}
                  onChange={e => setMaxClicks(e.target.value ? Number(e.target.value) : '')}
                  placeholder="مثال: 50"
                  className="settings-input"
                  dir="ltr"
                  required={hasMaxClicks}
                />
              </div>
            )}
          </div>

          {/* 5. Safe Browsing Interstitial */}
          <div className="protection-rule-card">
            <div className="protection-rule-header">
              <div className="protection-rule-icon safe">
                <ExternalLink size={18} />
              </div>
              <div className="protection-rule-info">
                <div className="protection-rule-title">شاشة التنبيه الأمني (Interstitial Warning)</div>
                <div className="protection-rule-desc">عرض عد تنازلي 3 ثوانٍ قبل مغادرة المنصة إلى الموقع الخارجي</div>
              </div>
              <button
                type="button"
                className={`settings-interactive-switch ${interstitial ? 'on' : 'off'}`}
                onClick={() => setInterstitial(!interstitial)}
              >
                <div className="switch-knob" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="settings-form-actions" style={{ marginTop: '14px' }}>
            <button
              type="button"
              className="elink-secondary-btn"
              onClick={onClose}
              disabled={saving}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="settings-save-btn"
              disabled={saving}
            >
              {saving ? <Loader2 size={15} className="spin" /> : <Check size={15} />}
              <span>{saving ? 'جاري حفظ القواعد...' : 'حفظ قواعد الأمان'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
