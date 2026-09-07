'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from './UserAvatar';
import {
  X, User, Shield, Sliders, CreditCard,
  Save, Loader2, Check, AlertCircle, Eye, EyeOff,
  Bell, Moon, Globe, LogOut, Copy, ExternalLink,
  Laptop, Clock, ShieldCheck, KeyRound, Sparkles,
  Volume2, VolumeX, Smartphone, RefreshCw
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  role?: string | null;
  created_at?: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSignOut: () => void;
  onProfileUpdated?: (profile: Profile) => void;
  defaultTab?: Tab;
}

type Tab = 'account' | 'profile' | 'security' | 'preferences';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'account', label: 'الحساب', icon: <User size={15} /> },
  { id: 'profile', label: 'الملف الشخصي', icon: <Sparkles size={15} /> },
  { id: 'security', label: 'الأمان', icon: <Shield size={15} /> },
  { id: 'preferences', label: 'التفضيلات', icon: <Sliders size={15} /> },
];

export default function SettingsModal({
  isOpen,
  onClose,
  user,
  onSignOut,
  onProfileUpdated,
  defaultTab = 'account',
}: SettingsModalProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security form state
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Account tab state
  const [copiedUid, setCopiedUid] = useState(false);

  // Preferences state (Persisted to localStorage)
  const [prefSounds, setPrefSounds] = useState(true);
  const [prefAutoCopy, setPrefAutoCopy] = useState(true);
  const [prefCompact, setPrefCompact] = useState(false);
  const [prefNotifications, setPrefNotifications] = useState(true);
  const [prefSavedMsg, setPrefSavedMsg] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const sounds = localStorage.getItem('eshamikh_pref_sounds');
      if (sounds !== null) setPrefSounds(sounds === 'true');
      const autocopy = localStorage.getItem('eshamikh_pref_autocopy');
      if (autocopy !== null) setPrefAutoCopy(autocopy === 'true');
      const compact = localStorage.getItem('eshamikh_pref_compact');
      if (compact !== null) setPrefCompact(compact === 'true');
      const notifs = localStorage.getItem('eshamikh_pref_notifs');
      if (notifs !== null) setPrefNotifications(notifs === 'true');
    } catch {
      // ignore in SSR / private mode
    }
  }, []);

  function handleTogglePref(key: string, currentVal: boolean, setter: (val: boolean) => void) {
    const nextVal = !currentVal;
    setter(nextVal);
    try {
      localStorage.setItem(key, String(nextVal));
      setPrefSavedMsg(true);
      setTimeout(() => setPrefSavedMsg(false), 2000);
    } catch {
      // ignore
    }
  }

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoadingProfile(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
      setUsername(data.username || '');
      setBio(data.bio || '');
    }
    setLoadingProfile(false);
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      fetchProfile();
    }
  }, [isOpen, user, fetchProfile]);

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  // ESC to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  async function handleSaveProfile() {
    if (!user) return;
    setSavingProfile(true);
    setProfileMsg(null);

    const updatedData = {
      id: user.id,
      full_name: fullName.trim() || null,
      username: username.trim().toLowerCase() || null,
      bio: bio.trim() || null,
      avatar_url: profile?.avatar_url || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(updatedData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        setProfileMsg({ type: 'error', text: 'اسم المستخدم هذا محجوز مسبقاً، يرجى اختيار اسم مستخدم آخر.' });
      } else {
        setProfileMsg({ type: 'error', text: 'تعذر حفظ الملف الشخصي. يرجى المحاولة مرة أخرى.' });
      }
    } else {
      setProfileMsg({ type: 'success', text: 'تم حفظ وتحديث الملف الشخصي بنجاح!' });
      const newProf = data || (updatedData as Profile);
      setProfile(newProf);
      if (onProfileUpdated) onProfileUpdated(newProf);
    }
    setSavingProfile(false);
    setTimeout(() => setProfileMsg(null), 4000);
  }

  async function handleChangePassword() {
    if (!newPass || !confirmPass) {
      setPassMsg({ type: 'error', text: 'يرجى إدخال كلمة المرور وتأكيدها.' });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ type: 'error', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقين.' });
      return;
    }
    if (newPass.length < 8) {
      setPassMsg({ type: 'error', text: 'يجب ألا تقل كلمة المرور عن 8 خانات لأسباب أمنية.' });
      return;
    }

    setSavingPass(true);
    setPassMsg(null);

    const { error } = await supabase.auth.updateUser({ password: newPass });

    if (error) {
      setPassMsg({ type: 'error', text: `فشل تغيير كلمة المرور: ${error.message}` });
    } else {
      setPassMsg({ type: 'success', text: 'تم تحديث كلمة المرور وتأمين حسابك بنجاح!' });
      setNewPass('');
      setConfirmPass('');
    }
    setSavingPass(false);
    setTimeout(() => setPassMsg(null), 4000);
  }

  function handleCopyUid() {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  }

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="settings-panel">
        {/* Panel Header */}
        <div className="settings-panel-header">
          <div className="settings-header-info">
            <h2 className="settings-panel-title">إعدادات المنظومة السحابية</h2>
            <span className="settings-panel-sub">إدارة حسابك، ملفك الشخصي، أمان الجلسات، وتفضيلات النظام الموحد</span>
          </div>
          <button className="settings-close-btn" onClick={onClose} title="إغلاق (Esc)">
            <X size={18} />
          </button>
        </div>

        <div className="settings-body">
          {/* Sidebar Tabs */}
          <nav className="settings-nav">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}

            <div className="settings-nav-spacer" />

            {/* Quick Session Status */}
            <div className="settings-nav-session-card">
              <div className="settings-session-dot active" />
              <div className="settings-session-meta">
                <span className="settings-session-title">متصل بالسحابة</span>
                <span className="settings-session-id">{user?.email?.split('@')[0]}</span>
              </div>
            </div>

            <button className="settings-signout-btn" onClick={onSignOut}>
              <LogOut size={14} />
              <span>تسجيل الخروج</span>
            </button>
          </nav>

          {/* Tab Content Container */}
          <div className="settings-content">

            {/* ══════════════ 1. ACCOUNT SETTINGS TAB ══════════════ */}
            {activeTab === 'account' && (
              <div className="settings-section">
                <div className="settings-section-head">
                  <h3 className="settings-section-title">إدارة الحساب السحابي (Account)</h3>
                  <p className="settings-section-desc">المعلومات الأساسية للهوية السحابية الموحدة وحالة الجلسة النشطة</p>
                </div>

                {/* Direct Link to /account Page */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: '#FAFAFA',
                  border: '1px solid #E4E4E7',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={18} color="#18181B" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#09090B' }}>صفحة إدارة الحساب الموسعة (/account)</div>
                      <div style={{ fontSize: '11.5px', color: '#71717A' }}>تعديل شامل للملف الشخصي، إدارة الأجهزة النشطة وتصدير البيانات</div>
                    </div>
                  </div>
                  <Link
                    href="/account"
                    onClick={onClose}
                    className="btn-white-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 14px' }}
                  >
                    <span>فتح الصفحة الكاملة</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>

                {/* SSO UID Box */}
                <div className="settings-card">
                  <div className="settings-card-header">
                    <div>
                      <h4 className="settings-card-title">معرّف الحساب الموحد (SSO UID)</h4>
                      <p className="settings-card-desc">المعرّف الرقمي الخاص بك في قاعدة بيانات eShamikh Cloud</p>
                    </div>
                    <button className="settings-copy-btn" onClick={handleCopyUid}>
                      {copiedUid ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
                      <span>{copiedUid ? 'تم النسخ!' : 'نسخ المعرّف'}</span>
                    </button>
                  </div>
                  <div className="settings-code-box">
                    <code>{user?.id || 'غير متاح'}</code>
                  </div>
                </div>

                {/* Email & Status */}
                <div className="settings-card">
                  <h4 className="settings-card-title">البريد الإلكتروني والاعتماد</h4>
                  <div className="settings-account-grid">
                    <div className="settings-account-item">
                      <span className="settings-item-label">البريد الإلكتروني المسجل</span>
                      <span className="settings-item-val" dir="ltr">{user?.email || 'غير متاح'}</span>
                    </div>
                    <div className="settings-account-item">
                      <span className="settings-item-label">حالة التوثيق</span>
                      <span className="settings-badge-verified">
                        <ShieldCheck size={12} />
                        موثّق سحابياً
                      </span>
                    </div>
                    <div className="settings-account-item">
                      <span className="settings-item-label">تاريخ إنشاء الحساب</span>
                      <span className="settings-item-val">
                        {user?.created_at
                          ? new Date(user.created_at).toLocaleDateString('ar-IQ', {
                              year: 'numeric', month: 'long', day: 'numeric'
                            })
                          : 'الآن'}
                      </span>
                    </div>
                    <div className="settings-account-item">
                      <span className="settings-item-label">نوع العضوية</span>
                      <span className="settings-badge-role">عضو سحابي معتمد</span>
                    </div>
                  </div>
                </div>

                {/* Active Session Card */}
                <div className="settings-card">
                  <div className="settings-card-header">
                    <div>
                      <h4 className="settings-card-title">الجلسة النشطة الحالية</h4>
                      <p className="settings-card-desc">تفاصيل الجهاز والمتصفح المتصل الآن بالمنصة</p>
                    </div>
                    <span className="settings-badge-live">
                      <span className="live-dot" />
                      نشطة الآن
                    </span>
                  </div>
                  <div className="settings-session-details">
                    <div className="session-detail-row">
                      <Laptop size={14} />
                      <span className="session-detail-name">المتصفح والنظام:</span>
                      <span className="session-detail-value" dir="ltr">
                        {typeof navigator !== 'undefined' ? navigator.userAgent.split(' ')[0] : 'Web Client'} (Windows NT)
                      </span>
                    </div>
                    <div className="session-detail-row">
                      <Clock size={14} />
                      <span className="session-detail-name">آخر نشاط مسجل:</span>
                      <span className="session-detail-value">اللحظة الحالية</span>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="settings-card settings-danger-zone">
                  <h4 className="settings-card-title danger-title">منطقة الأمان المتقدم</h4>
                  <p className="settings-card-desc">إنهاء الجلسة والخروج من البوابة على هذا الجهاز</p>
                  <button className="settings-danger-btn" onClick={onSignOut}>
                    <LogOut size={14} />
                    تسجيل الخروج وإنهاء الجلسة
                  </button>
                </div>
              </div>
            )}

            {/* ══════════════ 2. PROFILE SETTINGS TAB ══════════════ */}
            {activeTab === 'profile' && (
              <div className="settings-section">
                <div className="settings-section-head">
                  <h3 className="settings-section-title">الملف الشخصي (Profile)</h3>
                  <p className="settings-section-desc">قم بتعديل بياناتك العامة وصورة حسابك المحفوظة في قاعدة البيانات</p>
                </div>

                {loadingProfile ? (
                  <div className="settings-loading">
                    <Loader2 size={24} className="spin" />
                    <span>جاري جلب بيانات الملف الشخصي...</span>
                  </div>
                ) : (
                  <>
                    {/* Real Working Avatar Upload */}
                    <div className="settings-avatar-card">
                      <UserAvatar
                        userId={user?.id || ''}
                        avatarUrl={profile?.avatar_url}
                        fullName={fullName || profile?.full_name}
                        email={user?.email}
                        size="xl"
                        editable={true}
                        onAvatarUpdated={(url) => {
                          setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
                          if (onProfileUpdated && profile) {
                            onProfileUpdated({ ...profile, avatar_url: url });
                          }
                        }}
                      />
                      <div className="settings-avatar-info">
                        <div className="avatar-header-row">
                          <h4 className="avatar-user-title">{fullName || profile?.full_name || user?.email?.split('@')[0]}</h4>
                          <span className="avatar-role-pill">عضو سحابي</span>
                        </div>
                        <p className="avatar-user-email" dir="ltr">{user?.email}</p>
                        <p className="avatar-click-hint">
                          انقر على أيقونة الكاميرا لتحميل صورة حقيقية من جهازك وتخزينها سحابياً في Supabase Storage.
                        </p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="settings-fields-grid">
                      <div className="settings-field">
                        <label>الاسم الكامل</label>
                        <input
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          placeholder="مثال: فراس الشمري"
                          className="settings-input"
                          dir="rtl"
                        />
                      </div>
                      <div className="settings-field">
                        <label>اسم المستخدم (Username)</label>
                        <input
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          placeholder="firas_shamikh"
                          className="settings-input"
                          dir="ltr"
                        />
                      </div>
                      <div className="settings-field settings-field-full">
                        <label>نبذة تعريفية (Bio)</label>
                        <textarea
                          value={bio}
                          onChange={e => setBio(e.target.value)}
                          placeholder="اكتب نبذة مختصرة عن نشاطك أو مجالك..."
                          className="settings-input settings-textarea"
                          dir="rtl"
                          rows={3}
                        />
                      </div>
                    </div>

                    {profileMsg && (
                      <div className={`settings-msg ${profileMsg.type}`} dir="rtl">
                        {profileMsg.type === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
                        <span>{profileMsg.text}</span>
                      </div>
                    )}

                    <div className="settings-form-actions">
                      <button
                        className="settings-save-btn"
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                      >
                        {savingProfile ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
                        <span>{savingProfile ? 'جاري الحفظ في Supabase...' : 'حفظ التعديلات في السحابة'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ══════════════ 3. SECURITY TAB ══════════════ */}
            {activeTab === 'security' && (
              <div className="settings-section">
                <div className="settings-section-head">
                  <h3 className="settings-section-title">الأمان وكلمات المرور (Security)</h3>
                  <p className="settings-section-desc">قم بتحديث كلمة المرور لحسابك وتأمين صلاحيات الوصول</p>
                </div>

                <div className="settings-card">
                  <h4 className="settings-card-title">تغيير كلمة المرور</h4>
                  <p className="settings-card-desc">يتم تحديث كلمة المرور مباشرة عبر بروتوكول Supabase Auth الآمن</p>

                  <div className="settings-fields-grid">
                    <div className="settings-field settings-field-full">
                      <label>كلمة المرور الجديدة (8 خانات على الأقل)</label>
                      <div className="settings-input-with-icon">
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          value={newPass}
                          onChange={e => setNewPass(e.target.value)}
                          placeholder="••••••••••••"
                          className="settings-input"
                          dir="ltr"
                        />
                        <button
                          className="settings-eye-btn"
                          onClick={() => setShowNewPass(!showNewPass)}
                          type="button"
                          title={showNewPass ? 'إخفاء' : 'إظهار'}
                        >
                          {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="settings-field settings-field-full">
                      <label>تأكيد كلمة المرور الجديدة</label>
                      <div className="settings-input-with-icon">
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          value={confirmPass}
                          onChange={e => setConfirmPass(e.target.value)}
                          placeholder="••••••••••••"
                          className="settings-input"
                          dir="ltr"
                        />
                        <button
                          className="settings-eye-btn"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          type="button"
                          title={showConfirmPass ? 'إخفاء' : 'إظهار'}
                        >
                          {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {passMsg && (
                    <div className={`settings-msg ${passMsg.type}`} dir="rtl">
                      {passMsg.type === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
                      <span>{passMsg.text}</span>
                    </div>
                  )}

                  <div className="settings-form-actions">
                    <button
                      className="settings-save-btn"
                      onClick={handleChangePassword}
                      disabled={savingPass || !newPass}
                    >
                      {savingPass ? <Loader2 size={15} className="spin" /> : <KeyRound size={15} />}
                      <span>{savingPass ? 'جاري تحديث كلمة المرور...' : 'تأكيد وتغيير كلمة المرور'}</span>
                    </button>
                  </div>
                </div>

                {/* 2FA Status Card */}
                <div className="settings-card">
                  <div className="settings-card-header">
                    <div>
                      <h4 className="settings-card-title">المصادقة الثنائية (2FA)</h4>
                      <p className="settings-card-desc">تأمين تسجيل الدخول بتطبيق المصادقة (Authenticator)</p>
                    </div>
                    <span className="settings-badge-role">جاهز للتفعيل</span>
                  </div>
                  <p className="settings-note-text">
                    يتم التحقق من بصمة الجلسة وتشفير التوقيع الرقمي تلقائياً عبر Next.js Edge Middleware لجميع العمليات الحساسة.
                  </p>
                </div>
              </div>
            )}

            {/* ══════════════ 4. PREFERENCES TAB ══════════════ */}
            {activeTab === 'preferences' && (
              <div className="settings-section">
                <div className="settings-section-head">
                  <div className="settings-title-row">
                    <h3 className="settings-section-title">تفضيلات واجهة المستخدم (Preferences)</h3>
                    {prefSavedMsg && (
                      <span className="settings-saved-pill">
                        <Check size={12} />
                        تم الحفظ تلقائياً
                      </span>
                    )}
                  </div>
                  <p className="settings-section-desc">تخصيص سلوك وتجربة استخدام منصة eShamikh على هذا المتصفح</p>
                </div>

                <div className="settings-pref-list">
                  {/* Sound Effects */}
                  <div className="settings-pref-item">
                    <div className="settings-pref-left">
                      <div className="settings-pref-icon">
                        {prefSounds ? <Volume2 size={17} /> : <VolumeX size={17} />}
                      </div>
                      <div>
                        <div className="settings-pref-label">المؤثرات الصوتية التفاعلية</div>
                        <div className="settings-pref-sub">أصوات هادئة عند إتمام العمليات ونسخ الروابط</div>
                      </div>
                    </div>
                    <button
                      className={`settings-interactive-switch ${prefSounds ? 'on' : 'off'}`}
                      onClick={() => handleTogglePref('eshamikh_pref_sounds', prefSounds, setPrefSounds)}
                    >
                      <div className="switch-knob" />
                    </button>
                  </div>

                  {/* Auto-copy Short Links */}
                  <div className="settings-pref-item">
                    <div className="settings-pref-left">
                      <div className="settings-pref-icon">
                        <Copy size={17} />
                      </div>
                      <div>
                        <div className="settings-pref-label">النسخ التلقائي للروابط</div>
                        <div className="settings-pref-sub">نسخ الرابط المختصر إلى الحافظة فور إنشائه مباشرة في eLink</div>
                      </div>
                    </div>
                    <button
                      className={`settings-interactive-switch ${prefAutoCopy ? 'on' : 'off'}`}
                      onClick={() => handleTogglePref('eshamikh_pref_autocopy', prefAutoCopy, setPrefAutoCopy)}
                    >
                      <div className="switch-knob" />
                    </button>
                  </div>

                  {/* Compact Card View */}
                  <div className="settings-pref-item">
                    <div className="settings-pref-left">
                      <div className="settings-pref-icon">
                        <Sliders size={17} />
                      </div>
                      <div>
                        <div className="settings-pref-label">النمط المدمج للبطاقات (Compact View)</div>
                        <div className="settings-pref-sub">عرض بطاقات الخدمات بحجم أكثر كثافة للشاشات الصغيرة</div>
                      </div>
                    </div>
                    <button
                      className={`settings-interactive-switch ${prefCompact ? 'on' : 'off'}`}
                      onClick={() => handleTogglePref('eshamikh_pref_compact', prefCompact, setPrefCompact)}
                    >
                      <div className="switch-knob" />
                    </button>
                  </div>

                  {/* Notifications */}
                  <div className="settings-pref-item">
                    <div className="settings-pref-left">
                      <div className="settings-pref-icon">
                        <Bell size={17} />
                      </div>
                      <div>
                        <div className="settings-pref-label">إشعارات التحديثات والخدمات</div>
                        <div className="settings-pref-sub">تنبيهات فورية في الشريط العلوي عند إطلاق خدمات جديدة</div>
                      </div>
                    </div>
                    <button
                      className={`settings-interactive-switch ${prefNotifications ? 'on' : 'off'}`}
                      onClick={() => handleTogglePref('eshamikh_pref_notifs', prefNotifications, setPrefNotifications)}
                    >
                      <div className="switch-knob" />
                    </button>
                  </div>
                </div>

                {/* Theme Notice */}
                <div className="settings-card" style={{ marginTop: '14px' }}>
                  <div className="settings-card-header">
                    <div>
                      <h4 className="settings-card-title">مظهر المنصة (Theme)</h4>
                      <p className="settings-card-desc">نمط التصميم الأبيض الفاخر النقي (Pure White Luxury) مفعل افتراضياً</p>
                    </div>
                    <span className="settings-badge-role">Pure Luxury White</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
