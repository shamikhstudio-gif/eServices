'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  QrCode as QrIcon, 
  Sparkles,
  Layers,
  Palette
} from 'lucide-react';

interface QrStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: {
    slug: string;
    title?: string | null;
    destination_url: string;
  } | null;
}

const COLOR_PRESETS = [
  { name: 'أوبسيديان كلاسيك', fg: '#000000', bg: '#ffffff', border: '#000000' },
  { name: 'بلاتينيوم أحادي', fg: '#18181b', bg: '#f4f4f5', border: '#27272a' },
  { name: 'زمردي رقمي', fg: '#064e3b', bg: '#ecfdf5', border: '#10b981' },
  { name: 'عنبر ذهبي', fg: '#78350f', bg: '#fffbeb', border: '#f59e0b' },
  { name: 'بنفسجي ملكي', fg: '#3b0764', bg: '#faf5ff', border: '#8b5cf6' },
];

export default function QrStudioModal({ isOpen, onClose, link }: QrStudioModalProps) {
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [pngUrl, setPngUrl] = useState<string>('');
  const [svgString, setSvgString] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const shortUrl = typeof window !== 'undefined' && link
    ? `${window.location.origin}/s/${link.slug}`
    : link ? `https://services.eshamikh.com/s/${link.slug}` : '';

  useEffect(() => {
    if (!isOpen || !link) return;

    // Generate PNG Data URL (HD scale 10)
    QRCode.toDataURL(shortUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: selectedColor.fg,
        light: selectedColor.bg,
      },
    })
      .then(url => setPngUrl(url))
      .catch(console.error);

    // Generate SVG string (infinite vector)
    QRCode.toString(shortUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: selectedColor.fg,
        light: selectedColor.bg,
      },
    })
      .then(svg => setSvgString(svg))
      .catch(console.error);
  }, [isOpen, link, shortUrl, selectedColor]);

  if (!isOpen || !link) return null;

  function handleDownloadPng() {
    if (!pngUrl) return;
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = `elink-qr-${link?.slug || 'code'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleDownloadSvg() {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elink-qr-${link?.slug || 'code'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleCopyShortUrl() {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div 
        className="settings-modal-box qr-studio-modal" 
        onClick={e => e.stopPropagation()} 
        dir="rtl"
        style={{ maxWidth: '580px' }}
      >
        {/* Modal Header */}
        <div className="settings-modal-header">
          <div className="settings-modal-title-wrap">
            <div className="settings-modal-icon-badge">
              <QrIcon size={20} />
            </div>
            <div>
              <h2 className="settings-modal-title">استوديو رمز QR الديناميكي</h2>
              <p className="settings-modal-sub">
                رمز متجه دائم ومحدث تلقائياً للرابط المختصر <code>{link.slug}</code>
              </p>
            </div>
          </div>
          <button className="settings-modal-close-btn" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="qr-studio-body">
          
          {/* Dynamic Vector Notice */}
          <div className="qr-dynamic-notice">
            <Sparkles size={14} className="notice-star" />
            <span>
              <strong>رمز ديناميكي دائم:</strong> يمكنك تعديل الوجهة النهائية في أي وقت من لوحة التحكم دون الحاجة لإعادة طباعة هذا الرمز نهائياً.
            </span>
          </div>

          {/* QR Preview Display */}
          <div className="qr-preview-container">
            <div 
              className="qr-card-preview" 
              style={{ backgroundColor: selectedColor.bg, borderColor: selectedColor.border }}
            >
              {pngUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={pngUrl} 
                  alt={`QR Code for ${link.slug}`} 
                  className="qr-image-display"
                />
              ) : (
                <div className="qr-placeholder-loading">
                  <QrIcon size={48} className="spin" />
                  <span>جاري توليد الرمز المتجه...</span>
                </div>
              )}
            </div>

            {/* Target URL Info */}
            <div className="qr-target-info">
              <div className="qr-target-row">
                <span className="qr-target-label">الرابط المرمّز بالـ QR:</span>
                <button className="qr-copy-chip" onClick={handleCopyShortUrl}>
                  {copied ? <Check size={11} className="text-emerald" /> : <Copy size={11} />}
                  <span dir="ltr">{shortUrl}</span>
                </button>
              </div>
              <div className="qr-target-row">
                <span className="qr-target-label">الوجهة المستهدفة الحالية:</span>
                <span className="qr-target-val" dir="ltr">{link.destination_url}</span>
              </div>
            </div>
          </div>

          {/* Color Palettes Selection (Strictly NO BLUE) */}
          <div className="qr-palette-section">
            <div className="qr-section-label">
              <Palette size={13} />
              <span>أنماط الألوان والتباين (معتمدة للطباعة والمسح الفوري):</span>
            </div>
            <div className="qr-colors-grid">
              {COLOR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  className={`qr-color-btn ${selectedColor.name === preset.name ? 'active' : ''}`}
                  onClick={() => setSelectedColor(preset)}
                >
                  <span 
                    className="qr-color-swatch" 
                    style={{ background: preset.fg, borderColor: preset.border }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Download Action Buttons */}
          <div className="qr-actions-grid">
            <button 
              className="qr-download-btn vector-btn"
              onClick={handleDownloadSvg}
              disabled={!svgString}
            >
              <div className="qr-btn-text">
                <span className="qr-btn-title">تحميل SVG متجه (Vector)</span>
                <span className="qr-btn-sub">للطباعة اللانهائية، لوحات الإعلانات، والملصقات</span>
              </div>
              <Download size={18} />
            </button>

            <button 
              className="qr-download-btn raster-btn"
              onClick={handleDownloadPng}
              disabled={!pngUrl}
            >
              <div className="qr-btn-text">
                <span className="qr-btn-title">تحميل صورة عالية الدقة (PNG)</span>
                <span className="qr-btn-sub">للمنشورات الرقمية والمواقع والمراسلات</span>
              </div>
              <Download size={18} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
