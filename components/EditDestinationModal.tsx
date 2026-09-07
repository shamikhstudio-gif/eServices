'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  X, 
  Globe, 
  Check, 
  Loader2, 
  ExternalLink,
  Edit3,
  AlertCircle
} from 'lucide-react';

interface EditDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: {
    id: string;
    slug: string;
    title?: string | null;
    destination_url: string;
  } | null;
  onUpdated: (newTitle: string, newUrl: string) => void;
}

export default function EditDestinationModal({
  isOpen,
  onClose,
  link,
  onUpdated,
}: EditDestinationModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (link) {
      setTitle(link.title || '');
      setUrl(link.destination_url || '');
      setError(null);
    }
  }, [link]);

  if (!isOpen || !link) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!link) return;
    setError(null);

    let cleanUrl = url.trim();
    if (!cleanUrl) {
      setError('يرجى إدخال الرابط المستهدف');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    try {
      new URL(cleanUrl);
    } catch {
      setError('صيغة الرابط غير صحيحة، يرجى التأكد من كتابة عنوان موقع صالح');
      return;
    }

    setSaving(true);
    try {
      const { error: dbError } = await supabase
        .from('links')
        .update({
          title: title.trim() || null,
          destination_url: cleanUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', link.id);

      if (dbError) throw dbError;

      onUpdated(title.trim(), cleanUrl);
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ التعديلات');
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
        style={{ maxWidth: '520px' }}
      >
        {/* Header */}
        <div className="settings-modal-header">
          <div className="settings-modal-title-wrap">
            <div className="settings-modal-icon-badge">
              <Edit3 size={18} />
            </div>
            <div>
              <h2 className="settings-modal-title">تعديل الوجهة المستهدفة للرابط</h2>
              <p className="settings-modal-sub">
                الرابط المختصر <code>{link.slug}</code> سيوجه الزوار فورياً إلى الوجهة الجديدة
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

          <div className="settings-field">
            <label>عنوان أو وصف الرابط (اختياري)</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="مثال: متجر رمضان 2026 - العروض الخاصة"
              className="settings-input"
            />
          </div>

          <div className="settings-field">
            <label>الرابط المستهدف الجديد (Destination URL)</label>
            <div className="settings-input-with-icon">
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/new-landing-page"
                className="settings-input"
                dir="ltr"
                required
                autoFocus
              />
            </div>
            <span className="elink-field-hint">
              يتم تحويل الزوار ومسحات رمز الـ QR مباشرة إلى هذا الرابط فور حفظ التعديل.
            </span>
          </div>

          <div className="settings-form-actions" style={{ marginTop: '12px' }}>
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
              disabled={saving || !url.trim()}
            >
              {saving ? <Loader2 size={15} className="spin" /> : <Check size={15} />}
              <span>{saving ? 'جاري التحديث السحابي...' : 'حفظ الوجهة الجديدة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
