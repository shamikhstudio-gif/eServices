'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';
import NineDotsLauncher from '@/components/NineDotsLauncher';
import SettingsModal from '@/components/SettingsModal';
import QrStudioModal from '@/components/QrStudioModal';
import EditDestinationModal from '@/components/EditDestinationModal';
import LinkProtectionModal from '@/components/LinkProtectionModal';
import LinkAnalyticsModal from '@/components/LinkAnalyticsModal';
import { 
  Link2, 
  ArrowRight, 
  Plus, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  ShieldCheck, 
  Lock, 
  Clock, 
  Users, 
  ShieldAlert, 
  Edit3, 
  BarChart3, 
  Trash2, 
  Loader2, 
  Sparkles,
  Sliders,
  Settings,
  AlertCircle,
  Globe,
  Radio
} from 'lucide-react';

interface LinkItem {
  id: string;
  user_id: string;
  slug: string;
  destination_url: string;
  title: string | null;
  is_active: boolean;
  is_blocked: boolean;
  block_reason: string | null;
  password_hash: string | null;
  expires_at: string | null;
  max_clicks: number | null;
  clicks_count: number;
  enable_interstitial: boolean;
  qr_color: string;
  qr_bg_color: string;
  created_at: string;
  updated_at: string;
}

export default function ELinkDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  // Auth & Profile State
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Links State
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);

  // Quick Creation Form
  const [newUrl, setNewUrl] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'protected' | 'blocked'>('all');

  // Copy Feedback
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [qrModalLink, setQrModalLink] = useState<LinkItem | null>(null);
  const [editModalLink, setEditModalLink] = useState<LinkItem | null>(null);
  const [protectModalLink, setProtectModalLink] = useState<LinkItem | null>(null);
  const [analyticsModalLink, setAnalyticsModalLink] = useState<LinkItem | null>(null);
  const [deleteModalLink, setDeleteModalLink] = useState<LinkItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 1. Auth Guard & Initial Data Fetch
  useEffect(() => {
    async function init() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        router.replace('/?redirect_to=/elink');
        return;
      }

      setUser(currentUser);

      // Load Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (prof) setProfile(prof);

      // Load User Links
      await fetchUserLinks(currentUser.id);
      setAuthLoading(false);
    }

    init();
  }, [router, supabase]);

  async function fetchUserLinks(userId: string) {
    setLoadingLinks(true);
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLinks(data as LinkItem[]);
      }
    } catch (err) {
      console.error('Failed to fetch links:', err);
    } finally {
      setLoadingLinks(false);
    }
  }

  // 2. Create Link Handler
  async function handleCreateLink(e: React.FormEvent) {
    e.preventDefault();
    setCreateMsg(null);

    let cleanUrl = newUrl.trim();
    if (!cleanUrl) {
      setCreateMsg({ type: 'error', text: 'يرجى إدخال الرابط المستهدف' });
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    try {
      new URL(cleanUrl);
    } catch {
      setCreateMsg({ type: 'error', text: 'صيغة الرابط غير صحيحة، تأكد من كتابة عنوان موقع صالح' });
      return;
    }

    // Generate or clean slug
    let cleanSlug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!cleanSlug) {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      cleanSlug = '';
      for (let i = 0; i < 6; i++) {
        cleanSlug += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    setCreating(true);

    try {
      const { data, error } = await supabase
        .from('links')
        .insert({
          user_id: user.id,
          slug: cleanSlug,
          destination_url: cleanUrl,
          title: newTitle.trim() || null,
          is_active: true,
          is_blocked: false,
          clicks_count: 0,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('هذا الرمز المختصر مستخدم بالفعل، يرجى اختيار رمز آخر');
        }
        throw error;
      }

      setLinks(prev => [data as LinkItem, ...prev]);
      setNewUrl('');
      setNewSlug('');
      setNewTitle('');

      // Auto-copy preference check
      const shouldAutoCopy = typeof window !== 'undefined' && localStorage.getItem('eshamikh_pref_autocopy') === 'true';
      const shortUrl = typeof window !== 'undefined' ? `${window.location.origin}/s/${cleanSlug}` : `/s/${cleanSlug}`;

      if (shouldAutoCopy) {
        navigator.clipboard.writeText(shortUrl);
        setCreateMsg({ type: 'success', text: `تم إنشاء الرابط بنجاح ونسخه تلقائياً إلى الحافظة: /s/${cleanSlug}` });
      } else {
        setCreateMsg({ type: 'success', text: `تم إنشاء الرابط الذكي بنجاح: /s/${cleanSlug}` });
      }
    } catch (err: any) {
      setCreateMsg({ type: 'error', text: err.message || 'تعذر إنشاء الرابط' });
    } finally {
      setCreating(false);
    }
  }

  // 3. Delete Link Handler
  async function handleDeleteConfirm() {
    if (!deleteModalLink) return;
    setDeleting(true);

    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', deleteModalLink.id);

      if (error) throw error;

      setLinks(prev => prev.filter(l => l.id !== deleteModalLink.id));
      setDeleteModalLink(null);
    } catch (err: any) {
      alert('فشل حذف الرابط: ' + err.message);
    } finally {
      setDeleting(false);
    }
  }

  // 4. Copy Handler
  function handleCopy(slug: string) {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/s/${slug}`
      : `https://services.eshamikh.com/s/${slug}`;

    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  }

  // 5. Filtered Links Computation
  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        link.slug.toLowerCase().includes(q) ||
        (link.title && link.title.toLowerCase().includes(q)) ||
        link.destination_url.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Filter match
      if (activeFilter === 'active') return link.is_active && !link.is_blocked;
      if (activeFilter === 'protected') return Boolean(link.password_hash);
      if (activeFilter === 'blocked') return !link.is_active || link.is_blocked || (link.expires_at && new Date(link.expires_at) < new Date());

      return true;
    });
  }, [links, searchQuery, activeFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = links.length;
    const totalClicks = links.reduce((acc, l) => acc + (l.clicks_count || 0), 0);
    const active = links.filter(l => l.is_active && !l.is_blocked).length;
    const protectedCount = links.filter(l => Boolean(l.password_hash)).length;
    return { total, totalClicks, active, protectedCount };
  }, [links]);

  if (authLoading) {
    return (
      <div className="elink-loading-screen" dir="rtl">
        <Loader2 size={32} className="spin" />
        <span>جاري فتح منصة eLink السحابية...</span>
      </div>
    );
  }

  return (
    <div className="elink-page-layout" dir="rtl">
      
      {/* ══════════════════════════════════════════════════════════════════════
          1. TOP NAVIGATION HEADER
          ══════════════════════════════════════════════════════════════════════ */}
      <header className="elink-header">
        
        {/* Right Section: Back to Services & Brand Emblem */}
        <div className="elink-header-right">
          <Link href="/services" className="elink-back-btn" title="العودة إلى بوابة الخدمات">
            <ArrowRight size={16} />
            <span>بوابة الخدمات</span>
          </Link>

          <div className="elink-brand-separator" />

          <div className="elink-brand-emblem">
            <div className="elink-brand-icon-box">
              <Link2 size={18} />
            </div>
            <div>
              <div className="elink-brand-title-row">
                <span className="elink-brand-name">eLink</span>
                <span className="elink-brand-tag">محرك الروابط & QR</span>
              </div>
              <span className="elink-brand-desc">منظومة الروابط الديناميكية الذكية</span>
            </div>
          </div>
        </div>

        {/* Center: Live System Ticker */}
        <div className="elink-header-center">
          <div className="elink-system-pill">
            <Radio size={13} className="elink-pulse-icon" />
            <span>نظام eLink سحابي متصل</span>
            <span className="elink-latency-tag">22ms</span>
          </div>
        </div>

        {/* Left Section: NineDots Launcher & User Avatar */}
        <div className="elink-header-left">
          <button 
            className="elink-settings-icon-btn"
            onClick={() => setIsSettingsOpen(true)}
            title="الإعدادات العامة وخادم MCP"
          >
            <Settings size={16} />
          </button>

          <NineDotsLauncher />

          <div className="elink-user-pill" onClick={() => setIsSettingsOpen(true)}>
            <UserAvatar
              userId={user?.id || ''}
              avatarUrl={profile?.avatar_url}
              fullName={profile?.full_name || user?.user_metadata?.full_name}
              email={user?.email}
              size="sm"
            />
            <div className="elink-user-info-text">
              <span className="elink-user-name">
                {profile?.full_name || user?.user_metadata?.full_name || 'حساب معتمد'}
              </span>
              <span className="elink-user-role">eShamikh SSO</span>
            </div>
          </div>
        </div>

      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          2. MAIN CONTENT WRAPPER
          ══════════════════════════════════════════════════════════════════════ */}
      <main className="elink-main-content">
        
        {/* Quick Creation Card Bar */}
        <section className="elink-creation-card">
          <div className="elink-creation-header">
            <div className="elink-creation-title-row">
              <div className="elink-create-icon-badge">
                <Sparkles size={16} />
              </div>
              <h2 className="elink-creation-title">إنشاء رابط ديناميكي ذكي جديد</h2>
            </div>
            <span className="elink-creation-hint">
              يولد رمز QR دائم ومحدث تلقائياً يمكن طباعته واستخدامه فوراً
            </span>
          </div>

          <form onSubmit={handleCreateLink} className="elink-create-form">
            <div className="elink-create-inputs-grid">
              
              {/* Destination URL */}
              <div className="elink-create-input-wrap url-wrap">
                <label>الرابط المستهدف (Destination URL)*</label>
                <div className="elink-input-container">
                  <Globe size={15} className="elink-field-icon" />
                  <input
                    type="text"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="https://example.com/target-page"
                    className="elink-field-input"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              {/* Custom Slug */}
              <div className="elink-create-input-wrap slug-wrap">
                <label>الاسم المختصر (Custom Slug)</label>
                <div className="elink-input-container">
                  <span className="elink-slug-prefix">/s/</span>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={e => setNewSlug(e.target.value)}
                    placeholder="promo-2026"
                    className="elink-field-input slug-input"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="elink-create-input-wrap title-wrap">
                <label>العنوان التوضيحي (اختياري)</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="مثال: حملة التخفيضات الكبرى"
                  className="elink-field-input text-input"
                />
              </div>

            </div>

            {/* Alert Message */}
            {createMsg && (
              <div className={`elink-alert-msg ${createMsg.type}`}>
                {createMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                <span>{createMsg.text}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="elink-create-actions">
              <button 
                type="submit" 
                className="elink-create-submit-btn"
                disabled={creating || !newUrl.trim()}
              >
                {creating ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                <span>{creating ? 'جاري التوليد السحابي...' : 'توليد الرابط الذكي ورمز QR'}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Metrics Overview Bar */}
        <section className="elink-metrics-grid">
          
          <div className="elink-metric-card">
            <div className="elink-metric-top">
              <span className="elink-metric-label">إجمالي الروابط</span>
              <div className="elink-metric-icon">
                <Link2 size={16} />
              </div>
            </div>
            <div className="elink-metric-value">{metrics.total}</div>
            <div className="elink-metric-sub">روابط ذكية مسجلة</div>
          </div>

          <div className="elink-metric-card">
            <div className="elink-metric-top">
              <span className="elink-metric-label">إجمالي النقرات والمسحات</span>
              <div className="elink-metric-icon emerald">
                <BarChart3 size={16} />
              </div>
            </div>
            <div className="elink-metric-value emerald">{metrics.totalClicks}</div>
            <div className="elink-metric-sub">زيارة ومسحة مسجلة</div>
          </div>

          <div className="elink-metric-card">
            <div className="elink-metric-top">
              <span className="elink-metric-label">الروابط النشطة</span>
              <div className="elink-metric-icon emerald">
                <Check size={16} />
              </div>
            </div>
            <div className="elink-metric-value">{metrics.active}</div>
            <div className="elink-metric-sub">تعمل وتوجه الزوار الآن</div>
          </div>

          <div className="elink-metric-card">
            <div className="elink-metric-top">
              <span className="elink-metric-label">الروابط المحمية</span>
              <div className="elink-metric-icon amber">
                <Lock size={16} />
              </div>
            </div>
            <div className="elink-metric-value amber">{metrics.protectedCount}</div>
            <div className="elink-metric-sub">مشفرة بكلمة مرور</div>
          </div>

        </section>

        {/* Links Explorer Section */}
        <section className="elink-explorer-section">
          
          {/* Controls Bar (Search + Filter Tabs) */}
          <div className="elink-controls-bar">
            
            {/* Search Input */}
            <div className="elink-search-container">
              <Search size={15} className="elink-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="البحث بالرمز، العنوان، أو الرابط المستهدف..."
                className="elink-search-input"
              />
              {searchQuery && (
                <button className="elink-clear-search" onClick={() => setSearchQuery('')}>
                  إلغاء
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="elink-filter-tabs">
              <button
                className={`elink-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                الكل ({links.length})
              </button>
              <button
                className={`elink-filter-pill ${activeFilter === 'active' ? 'active' : ''}`}
                onClick={() => setActiveFilter('active')}
              >
                النشطة ({metrics.active})
              </button>
              <button
                className={`elink-filter-pill ${activeFilter === 'protected' ? 'active' : ''}`}
                onClick={() => setActiveFilter('protected')}
              >
                المحمية ({metrics.protectedCount})
              </button>
              <button
                className={`elink-filter-pill ${activeFilter === 'blocked' ? 'active' : ''}`}
                onClick={() => setActiveFilter('blocked')}
              >
                المعطلة
              </button>
            </div>

          </div>

          {/* Links Grid List */}
          {loadingLinks ? (
            <div className="elink-loading-box">
              <Loader2 size={26} className="spin" />
              <span>جاري تحميل الروابط والتحليلات...</span>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="elink-empty-state">
              <div className="elink-empty-icon">
                <Link2 size={40} />
              </div>
              <h3 className="elink-empty-title">لا توجد روابط مطابقة</h3>
              <p className="elink-empty-desc">
                {searchQuery
                  ? 'لم يتم العثور على أي رابط يطابق معايير البحث الحالية.'
                  : 'ابدأ بإنشاء أول رابط ذكي ورمز QR دائم عبر النموذج أعلاه.'}
              </p>
            </div>
          ) : (
            <div className="elink-links-grid">
              {filteredLinks.map(link => {
                const isBlocked = !link.is_active || link.is_blocked;
                const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
                const isProtected = Boolean(link.password_hash);
                const shortUrl = typeof window !== 'undefined'
                  ? `${window.location.origin}/s/${link.slug}`
                  : `https://services.eshamikh.com/s/${link.slug}`;

                return (
                  <div key={link.id} className="elink-link-card">
                    
                    {/* Card Header: Title & Status */}
                    <div className="elink-card-head">
                      <div className="elink-card-title-group">
                        <h3 className="elink-card-title">{link.title || link.slug}</h3>
                        <span className="elink-card-date">
                          {new Date(link.created_at).toLocaleDateString('ar-IQ', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div className="elink-badges-row">
                        {isBlocked ? (
                          <span className="elink-badge danger">
                            <ShieldAlert size={11} />
                            معطل
                          </span>
                        ) : isExpired ? (
                          <span className="elink-badge warning">
                            <Clock size={11} />
                            منتهي
                          </span>
                        ) : isProtected ? (
                          <span className="elink-badge warning">
                            <Lock size={11} />
                            محمي بكلمة سر
                          </span>
                        ) : (
                          <span className="elink-badge emerald">
                            <span className="live-dot" />
                            نشط
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Short Slug Row */}
                    <div className="elink-slug-bar">
                      <div className="elink-slug-content" dir="ltr">
                        <Link2 size={13} className="elink-slug-icon" />
                        <span className="elink-slug-text">{shortUrl}</span>
                      </div>
                      <div className="elink-slug-actions">
                        <button
                          className="elink-copy-btn"
                          onClick={() => handleCopy(link.slug)}
                          title="نسخ الرابط المختصر"
                        >
                          {copiedSlug === link.slug ? (
                            <>
                              <Check size={12} className="text-emerald" />
                              <span>تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>نسخ</span>
                            </>
                          )}
                        </button>
                        <a
                          href={shortUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="elink-visit-btn"
                          title="فتح واختبار الرابط"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>

                    {/* Destination Target URL */}
                    <div className="elink-target-box">
                      <span className="elink-target-label">الوجهة المستهدفة:</span>
                      <span className="elink-target-url" dir="ltr">{link.destination_url}</span>
                    </div>

                    {/* Metrics & Protection Info Pills */}
                    <div className="elink-info-pills">
                      <div className="elink-clicks-pill">
                        <span className="live-dot" />
                        <span className="clicks-num">{link.clicks_count || 0}</span>
                        <span>نقرة ومسحة</span>
                      </div>

                      {link.max_clicks && (
                        <div className="elink-prop-pill">
                          <Users size={11} />
                          <span>السقف: {link.max_clicks}</span>
                        </div>
                      )}

                      {link.expires_at && (
                        <div className="elink-prop-pill">
                          <Clock size={11} />
                          <span>ينتهي: {new Date(link.expires_at).toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}

                      {link.enable_interstitial && (
                        <div className="elink-prop-pill">
                          <ShieldCheck size={11} />
                          <span>فحص أمني</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="elink-card-actions">
                      <button
                        className="elink-action-btn primary"
                        onClick={() => setQrModalLink(link)}
                        title="فتح استوديو الـ QR وتنزيل SVG أو PNG"
                      >
                        <QrCode size={14} />
                        <span>استوديو QR</span>
                      </button>

                      <button
                        className="elink-action-btn"
                        onClick={() => setEditModalLink(link)}
                        title="تعديل الرابط المستهدف النهائي"
                      >
                        <Edit3 size={14} />
                        <span>تعديل الوجهة</span>
                      </button>

                      <button
                        className="elink-action-btn"
                        onClick={() => setProtectModalLink(link)}
                        title="قواعد الأمان، كلمة المرور، وسقف النقرات"
                      >
                        <ShieldCheck size={14} />
                        <span>الأمان</span>
                      </button>

                      <button
                        className="elink-action-btn"
                        onClick={() => setAnalyticsModalLink(link)}
                        title="عرض سجل الزيارات والنقرات"
                      >
                        <BarChart3 size={14} />
                        <span>التحليلات</span>
                      </button>

                      <button
                        className="elink-action-btn danger"
                        onClick={() => setDeleteModalLink(link)}
                        title="حذف هذا الرابط"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </section>

      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          3. MODALS
          ══════════════════════════════════════════════════════════════════════ */}
      
      {/* QR Studio Modal */}
      <QrStudioModal
        isOpen={Boolean(qrModalLink)}
        onClose={() => setQrModalLink(null)}
        link={qrModalLink}
      />

      {/* Edit Destination Modal */}
      <EditDestinationModal
        isOpen={Boolean(editModalLink)}
        onClose={() => setEditModalLink(null)}
        link={editModalLink}
        onUpdated={(newTitle, newUrl) => {
          if (!editModalLink) return;
          setLinks(prev => prev.map(l => l.id === editModalLink.id ? { ...l, title: newTitle || null, destination_url: newUrl } : l));
        }}
      />

      {/* Link Protection Rules Modal */}
      <LinkProtectionModal
        isOpen={Boolean(protectModalLink)}
        onClose={() => setProtectModalLink(null)}
        link={protectModalLink}
        onUpdated={(changes) => {
          if (!protectModalLink) return;
          setLinks(prev => prev.map(l => l.id === protectModalLink.id ? { ...l, ...changes } : l));
        }}
      />

      {/* Link Analytics Modal */}
      <LinkAnalyticsModal
        isOpen={Boolean(analyticsModalLink)}
        onClose={() => setAnalyticsModalLink(null)}
        link={analyticsModalLink}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onSignOut={async () => {
          await supabase.auth.signOut();
          router.replace('/');
        }}
      />

      {/* Delete Confirmation Dialog */}
      {deleteModalLink && (
        <div className="settings-modal-backdrop" onClick={() => setDeleteModalLink(null)}>
          <div 
            className="settings-modal-box" 
            onClick={e => e.stopPropagation()} 
            dir="rtl"
            style={{ maxWidth: '440px' }}
          >
            <div className="settings-modal-header">
              <div className="settings-modal-title-wrap">
                <div className="settings-modal-icon-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                  <Trash2 size={18} />
                </div>
                <div>
                  <h2 className="settings-modal-title" style={{ color: '#f87171' }}>تأكيد حذف الرابط</h2>
                  <p className="settings-modal-sub">سيتم حذف الرابط المختصر وإحصائياته نهائياً</p>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 20px', fontSize: '13px', color: '#d4d4d8', lineHeight: 1.5 }}>
              هل أنت متأكد من رغبتك في حذف الرابط <code>{deleteModalLink.slug}</code>؟ لن يتمكن أي شخص مسح رمز الـ QR أو فتح الرابط بعد الحذف.
            </div>

            <div className="settings-form-actions" style={{ padding: '12px 20px 16px', gap: '8px' }}>
              <button
                className="elink-secondary-btn"
                onClick={() => setDeleteModalLink(null)}
                disabled={deleting}
              >
                إلغاء
              </button>
              <button
                className="settings-danger-btn"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                <span>{deleting ? 'جاري الحذف...' : 'تأكيد الحذف النهائي'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
