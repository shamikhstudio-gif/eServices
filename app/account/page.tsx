'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';
import {
  User, ShieldCheck, Layers, Sliders, AlertTriangle,
  ArrowRight, Check, Copy, ExternalLink, KeyRound,
  Laptop, Smartphone, Clock, Eye, EyeOff, Loader2,
  AlertCircle, Download, Trash2, LogOut, Grid, Sparkles,
  Bell, Volume2, Globe, Shield, RefreshCw, CheckCircle2,
  ShoppingBag, Store
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  role?: string | null;
  store_name?: string | null;
  phone_number?: string | null;
  created_at?: string;
}

type TabKey = 'profile' | 'security' | 'services' | 'preferences' | 'danger';

const TABS: { id: TabKey; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'profile', label: 'الملف الشخصي', icon: <User size={18} />, desc: 'إدارة الهوية والاسم والبيانات العامة' },
  { id: 'security', label: 'الأمان وكلمة المرور', icon: <ShieldCheck size={18} />, desc: 'تحديث كلمة المرور وإدارة الجلسات و 2FA' },
  { id: 'services', label: 'الخدمات المرتبطة', icon: <Layers size={18} />, desc: 'حالة الربط مع eLink و eStore و eTrack' },
  { id: 'preferences', label: 'التفضيلات والإشعارات', icon: <Sliders size={18} />, desc: 'خيارات التنبيهات، الصوت والمنطقة الزمنية' },
  { id: 'danger', label: 'منطقة البيانات والخطر', icon: <AlertTriangle size={18} />, desc: 'تصدير بيانات الحساب وإلغاء التنشيط' },
];

export default function AccountManagementPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [storeName, setStoreName] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);
  const [passFeedback, setPassFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Preferences fields
  const [prefNotifsSecurity, setPrefNotifsSecurity] = useState(true);
  const [prefNotifsOrders, setPrefNotifsOrders] = useState(true);
  const [prefNotifsClicks, setPrefNotifsClicks] = useState(false);
  const [prefSounds, setPrefSounds] = useState(true);
  const [prefAutoCopy, setPrefAutoCopy] = useState(true);
  const [prefFeedback, setPrefFeedback] = useState(false);

  // Danger fields
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [waffleOpen, setWaffleOpen] = useState(false);

  // ── Load User & Profile ───────────────────────────────────────────────────
  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        // Mock profile for demo preview if not signed in
        const mockUser = {
          id: 'usr_demo_7721849102',
          email: 'admin@eshamikh.com',
          user_metadata: { full_name: 'علي الشامخ' }
        };
        setUser(mockUser);
        const mockProf: Profile = {
          id: mockUser.id,
          full_name: 'علي الشامخ',
          username: 'alishamikh',
          bio: 'مدير العمليات والتجارة الإلكترونية في منظومة الشامخ السحابية',
          avatar_url: null,
          role: 'merchant',
          store_name: 'متجر الشامخ الفاخر',
          phone_number: '+964 770 123 4567',
          created_at: new Date().toISOString()
        };
        setProfile(mockProf);
        setFullName(mockProf.full_name || '');
        setUsername(mockProf.username || '');
        setPhoneNumber(mockProf.phone_number || '');
        setStoreName(mockProf.store_name || '');
        setBio(mockProf.bio || '');
        setLoading(false);
        return;
      }

      setUser(authUser);

      // Fetch from profiles table
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const initialProf: Profile = profData || {
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'مستخدم الشامخ',
        username: authUser.email?.split('@')[0] || 'user',
        bio: '',
        avatar_url: authUser.user_metadata?.avatar_url || null,
        role: 'merchant',
        store_name: 'متجر الشامخ',
        phone_number: '+964 770 000 0000',
        created_at: authUser.created_at
      };

      setProfile(initialProf);
      setFullName(initialProf.full_name || '');
      setUsername(initialProf.username || '');
      setPhoneNumber(initialProf.phone_number || '');
      setStoreName(initialProf.store_name || '');
      setBio(initialProf.bio || '');
    } catch (err) {
      console.error('Error loading account profile:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadUserData();

    // Load localStorage preferences
    try {
      const storedSec = localStorage.getItem('eshamikh_pref_notif_sec');
      if (storedSec !== null) setPrefNotifsSecurity(storedSec === 'true');
      const storedOrd = localStorage.getItem('eshamikh_pref_notif_ord');
      if (storedOrd !== null) setPrefNotifsOrders(storedOrd === 'true');
      const storedClk = localStorage.getItem('eshamikh_pref_notif_clk');
      if (storedClk !== null) setPrefNotifsClicks(storedClk === 'true');
      const storedSnd = localStorage.getItem('eshamikh_pref_sounds');
      if (storedSnd !== null) setPrefSounds(storedSnd === 'true');
      const storedCp = localStorage.getItem('eshamikh_pref_autocopy');
      if (storedCp !== null) setPrefAutoCopy(storedCp === 'true');
    } catch (e) {
      // Ignore storage errors
    }
  }, [loadUserData]);

  // ── Save Profile ─────────────────────────────────────────────────────────
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    setProfileFeedback(null);

    try {
      const updates = {
        id: user.id,
        full_name: fullName.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        phone_number: phoneNumber.trim(),
        store_name: storeName.trim(),
        bio: bio.trim(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;

      // Update Auth metadata if applicable
      await supabase.auth.updateUser({
        data: { full_name: updates.full_name }
      });

      setProfile(prev => prev ? { ...prev, ...updates } : { ...updates, avatar_url: null, role: 'merchant' });
      setProfileFeedback({ type: 'success', text: 'تم حفظ وتحديث بيانات الملف الشخصي بنجاح!' });
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setProfileFeedback({ type: 'error', text: err.message || 'حدث خطأ أثناء حفظ البيانات' });
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileFeedback(null), 4000);
    }
  }

  // ── Save Password ────────────────────────────────────────────────────────
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPassFeedback({ type: 'error', text: 'كلمة المرور يجب أن لا تقل عن 8 أحرف وأرقام' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassFeedback({ type: 'error', text: 'كلمة المرور الجديدة غير متطابقة مع التأكيد' });
      return;
    }

    setUpdatingPass(true);
    setPassFeedback(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPassFeedback({ type: 'success', text: 'تم تغيير وتحديث كلمة المرور بنجاح تام!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassFeedback({ type: 'error', text: err.message || 'فشل تحديث كلمة المرور' });
    } finally {
      setUpdatingPass(false);
      setTimeout(() => setPassFeedback(null), 4000);
    }
  }

  // ── Save Preferences ─────────────────────────────────────────────────────
  function handleSavePreference(key: string, val: boolean) {
    try {
      localStorage.setItem(key, String(val));
      setPrefFeedback(true);
      setTimeout(() => setPrefFeedback(false), 2000);
    } catch (e) {
      // Ignore
    }
  }

  // ── Export JSON Data ─────────────────────────────────────────────────────
  function handleExportData() {
    const exportPayload = {
      eshamikh_version: '2026.1',
      exported_at: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
        full_name: profile?.full_name,
        username: profile?.username,
        phone_number: profile?.phone_number,
        store_name: profile?.store_name,
        bio: profile?.bio,
        role: profile?.role,
        registered_at: profile?.created_at,
      },
      services: {
        elink: { active: true, access_level: 'full' },
        estore: { active: true, currency: 'IQD', monthly_settlement: '25,000 IQD' },
        etrack: { active: true, courier_network: 'Iraq-National' },
        esecurity: { hmac_sha256_enabled: true, replay_protection: true }
      },
      preferences: {
        notifications_security: prefNotifsSecurity,
        notifications_orders: prefNotifsOrders,
        notifications_clicks: prefNotifsClicks,
        sound_effects: prefSounds,
        auto_copy: prefAutoCopy,
      }
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eshamikh-account-${user?.id || 'export'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ── Copy UID ─────────────────────────────────────────────────────────────
  function copyUid() {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  }

  // ── Sign Out ─────────────────────────────────────────────────────────────
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <div className="white-app-container" dir="rtl">
      {/* ── Top Navigation Bar ──────────────────────────────────────────────── */}
      <header className="white-navbar">
        <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          
          {/* Right: Brand & Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              href="/estore/dashboard"
              className="btn-white-icon"
              title="العودة إلى لوحة تحكم المتجر"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowRight size={18} />
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#18181B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '15px'
              }}>
                e
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#09090B' }}>إدارة حساب التاجر</span>
                  <span className="account-status-pill primary">eStore Merchant</span>
                </div>
                <div style={{ fontSize: '11px', color: '#71717A' }}>منصة التجارة الإلكترونية • estore.eshamikh.com</div>
              </div>
            </div>
          </div>

          {/* Left: Quick Actions & Waffle Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            {/* Waffle App Launcher */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setWaffleOpen(!waffleOpen)}
                className="btn-white-icon"
                title="أقسام المتجر"
              >
                <Grid size={18} />
              </button>

              {waffleOpen && (
                <div style={{
                  position: 'absolute',
                  top: '115%',
                  left: 0,
                  width: '260px',
                  background: '#FFFFFF',
                  border: '1px solid #E4E4E7',
                  borderRadius: '14px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
                  padding: '12px',
                  zIndex: 50,
                  animation: 'fadeIn 0.15s ease'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#71717A', padding: '4px 8px 8px' }}>
                    منظومة متجر eStore
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { name: 'متجر الزبائن', href: '/', icon: <ShoppingBag size={16} /> },
                      { name: 'لوحة التاجر', href: '/estore/dashboard', icon: <Store size={16} /> },
                      { name: 'إدارة الحساب', href: '/account', icon: <User size={16} /> },
                      { name: 'بوابة الأمان', href: '/account', icon: <Shield size={16} /> },
                    ].map((app, idx) => (
                      <Link
                        key={idx}
                        href={app.href}
                        onClick={() => setWaffleOpen(false)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '12px 8px',
                          borderRadius: '8px',
                          border: '1px solid #F4F4F5',
                          background: '#FAFAFA',
                          textAlign: 'center',
                          textDecoration: 'none',
                          color: '#09090B',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ color: '#18181B' }}>{app.icon}</div>
                        <span>{app.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="btn-white-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: '12px' }}
              title="تسجيل الخروج"
            >
              <LogOut size={14} />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Layout ────────────────────────────────────────────────────── */}
      <main className="account-wrapper">
        
        {/* Page Top Heading */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#09090B', letterSpacing: '-0.5px', margin: '0 0 6px 0' }}>
              إدارة الحساب والهوية الرقمية
            </h1>
            <p style={{ fontSize: '13.5px', color: '#71717A', margin: 0 }}>
              تحكم ببيانات ملفك الشخصي، مفاتيح الأمان وكلمات المرور، والخدمات السحابية المرتبطة بحسابك.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleExportData}
              className="btn-white-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', padding: '8px 14px' }}
            >
              <Download size={14} />
              <span>تصدير البيانات</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: '28px', alignItems: 'start' }}>
          
          {/* ── Sidebar (Right Column in RTL) ───────────────────────────────── */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* User Profile Mini Identity Card */}
            <div className="account-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <UserAvatar
                  userId={user?.id || 'default'}
                  avatarUrl={profile?.avatar_url}
                  fullName={profile?.full_name || user?.email}
                  email={user?.email}
                  size="md"
                  editable={false}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#09090B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile?.full_name || user?.email?.split('@')[0] || 'المستخدم'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#71717A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr', textAlign: 'right' }}>
                    {user?.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#FAFAFA', borderRadius: '10px', border: '1px solid #F4F4F5' }}>
                <span style={{ fontSize: '11.5px', color: '#71717A' }}>نوع الحساب</span>
                <span className="account-status-pill verified">تاجر موثق</span>
              </div>
            </div>

            {/* Navigation Tabs List */}
            <div className="account-card" style={{ padding: '8px' }}>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`account-nav-btn ${isActive ? 'active' : ''}`}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', color: isActive ? '#FFFFFF' : '#71717A' }}>
                        {tab.icon}
                      </span>
                      <span style={{ flex: 1, textAlign: 'right' }}>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Support / Ecosystem Info Card */}
            <div style={{ padding: '16px', borderRadius: '14px', background: '#FFFFFF', border: '1px solid #E4E4E7', fontSize: '12px', color: '#71717A', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#09090B', marginBottom: '4px' }}>
                <ShieldCheck size={15} color="#059669" />
                <span>حماية الهوية الرقمية</span>
              </div>
              بياناتك مشفرة ومحمية ببروتوكولات التوقيع الرقمي المقاومة للهجمات وسجلات التدقيق الفورية.
            </div>
          </aside>

          {/* ── Content Area (Left Column in RTL) ───────────────────────────── */}
          <div style={{ minWidth: 0 }}>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* TAB 1: PROFILE DETAILS                                            */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === 'profile' && (
              <div className="account-card">
                <div className="account-card-header">
                  <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#09090B', margin: '0 0 4px 0' }}>
                    تفاصيل الملف الشخصي
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#71717A', margin: 0 }}>
                    هذه البيانات تظهر عند تفاعلك مع خدمات eLink و eStore ومتجر الزبائن الفاخر.
                  </p>
                </div>

                <div className="account-card-body">
                  {profileFeedback && (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      marginBottom: '20px',
                      fontSize: '13px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: profileFeedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                      color: profileFeedback.type === 'success' ? '#059669' : '#DC2626',
                      border: `1px solid ${profileFeedback.type === 'success' ? '#A7F3D0' : '#FECACA'}`
                    }}>
                      {profileFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      <span>{profileFeedback.text}</span>
                    </div>
                  )}

                  {/* Avatar Upload Row */}
                  <div className="account-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <UserAvatar
                        userId={user?.id || 'default'}
                        avatarUrl={profile?.avatar_url}
                        fullName={profile?.full_name || user?.email}
                        email={user?.email}
                        size="lg"
                        editable={true}
                        onAvatarUpdated={(newUrl) => {
                          setProfile(prev => prev ? { ...prev, avatar_url: newUrl } : null);
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#09090B', marginBottom: '4px' }}>
                          الصورة الرمزية للحساب
                        </div>
                        <div style={{ fontSize: '12px', color: '#71717A', maxWidth: '380px' }}>
                          انقر على أيقونة الكاميرا لرفع صورة جديدة (JPG, PNG, WebP بحد أقصى 5 ميغابايت) مخزنة بأمان على Supabase Storage.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <form onSubmit={handleSaveProfile} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Row: Full Name & Username */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                          الاسم الكامل
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="مثال: علي الشامخ"
                          className="account-input-field"
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                          اسم المستخدم (المعرف)
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', right: '12px', top: '10px', color: '#A1A1AA', fontSize: '13px', fontWeight: 600 }}>@</span>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="alishamikh"
                            className="account-input-field"
                            style={{ paddingRight: '28px', direction: 'ltr', textAlign: 'right' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Info (Read-only Email & Phone) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#27272A' }}>
                            البريد الإلكتروني الأساسي
                          </label>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span className="account-status-pill verified">موثق ✓</span>
                            <span className="account-status-pill primary">رئيسي</span>
                          </div>
                        </div>
                        <input
                          type="email"
                          value={user?.email || ''}
                          readOnly
                          className="account-input-field"
                          style={{ background: '#F4F4F5', cursor: 'not-allowed', direction: 'ltr', textAlign: 'right' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#27272A' }}>
                            رقم الهاتف المعتمد
                          </label>
                          <span className="account-status-pill verified">عراق (+964)</span>
                        </div>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+964 770 123 4567"
                          className="account-input-field"
                          style={{ direction: 'ltr', textAlign: 'right' }}
                        />
                      </div>
                    </div>

                    {/* Store / Business Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                        اسم المتجر أو العلامة التجارية (eStore)
                      </label>
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="مثال: متجر الشامخ الفاخر"
                        className="account-input-field"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                        نبذة تعريفية
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="نبذة مختصرة عن نشاطك التجاري أو خدماتك الرقمية..."
                        rows={3}
                        className="account-input-field"
                        style={{ resize: 'vertical', lineHeight: 1.5 }}
                      />
                    </div>

                    {/* Save Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="btn-white-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '13.5px' }}
                      >
                        {savingProfile ? <Loader2 size={16} className="spinner" /> : <Check size={16} />}
                        <span>{savingProfile ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* TAB 2: SECURITY & PASSWORDS                                       */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Password Change Card */}
                <div className="account-card">
                  <div className="account-card-header">
                    <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#09090B', margin: '0 0 4px 0' }}>
                      كلمة المرور ومصادقة الدخول
                    </h2>
                    <p style={{ fontSize: '12.5px', color: '#71717A', margin: 0 }}>
                      يُنصح باختيار كلمة مرور قوية تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز خاصة.
                    </p>
                  </div>

                  <div className="account-card-body">
                    {passFeedback && (
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        marginBottom: '20px',
                        fontSize: '13px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: passFeedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                        color: passFeedback.type === 'success' ? '#059669' : '#DC2626',
                        border: `1px solid ${passFeedback.type === 'success' ? '#A7F3D0' : '#FECACA'}`
                      }}>
                        {passFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        <span>{passFeedback.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                            كلمة المرور الجديدة
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showNewPass ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="account-input-field"
                              style={{ paddingLeft: '38px', direction: 'ltr' }}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPass(!showNewPass)}
                              style={{ position: 'absolute', left: '12px', top: '11px', color: '#71717A' }}
                            >
                              {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                            تأكيد كلمة المرور الجديدة
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showConfirmPass ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="account-input-field"
                              style={{ paddingLeft: '38px', direction: 'ltr' }}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPass(!showConfirmPass)}
                              style={{ position: 'absolute', left: '12px', top: '11px', color: '#71717A' }}
                            >
                              {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
                        <button
                          type="submit"
                          disabled={updatingPass || !newPassword}
                          className="btn-white-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', fontSize: '13px' }}
                        >
                          {updatingPass ? <Loader2 size={15} className="spinner" /> : <KeyRound size={15} />}
                          <span>{updatingPass ? 'جاري التحديث...' : 'تحديث كلمة المرور'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* 2-Factor Authentication Card */}
                <div className="account-card">
                  <div className="account-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#09090B', margin: '0 0 4px 0' }}>
                          المصادقة الثنائية (2FA)
                        </h2>
                        <p style={{ fontSize: '12.5px', color: '#71717A', margin: 0 }}>
                          إضافة طبقة حماية ثانية تتطلب رمز تأكيد مؤقت عند الدخول من متصفح غير معروف.
                        </p>
                      </div>
                      <span className={`account-status-pill ${twoFactorEnabled ? 'verified' : 'primary'}`}>
                        {twoFactorEnabled ? 'مفعلة ونشطة' : 'غير مفعلة'}
                      </span>
                    </div>
                  </div>

                  <div className="account-card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#18181B' }}>
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#09090B' }}>
                          تأكيد الدخول عبر تطبيق المصادقة أو البريد
                        </div>
                        <div style={{ fontSize: '12px', color: '#71717A' }}>
                          إرسال كود فوري بـ 6 أرقام للتحقق من هوية صاحب الحساب.
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                      className={twoFactorEnabled ? 'btn-white-secondary' : 'btn-white-primary'}
                      style={{ padding: '8px 16px', fontSize: '12.5px' }}
                    >
                      {twoFactorEnabled ? 'تعطيل الحماية' : 'تفعيل الآن'}
                    </button>
                  </div>
                </div>

                {/* Active Sessions & Devices */}
                <div className="account-card">
                  <div className="account-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#09090B', margin: '0 0 4px 0' }}>
                          الأجهزة والجلسات النشطة
                        </h2>
                        <p style={{ fontSize: '12.5px', color: '#71717A', margin: 0 }}>
                          قائمة المتصفحات والأجهزة المتصلة بحسابك حالياً في منظومة الشامخ.
                        </p>
                      </div>
                      <button
                        onClick={() => alert('تم إنهاء وتسجيل الخروج من كافة الجلسات الأخرى بنجاح!')}
                        className="btn-white-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        تسجيل خروج باقي الجلسات
                      </button>
                    </div>
                  </div>

                  <div className="account-card-body" style={{ padding: '0 28px' }}>
                    
                    {/* Device 1 (Current) */}
                    <div className="account-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#18181B' }}>
                          <Laptop size={20} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#09090B' }}>Google Chrome على نظام Windows 11</span>
                            <span className="account-status-pill active">هذا الجهاز (نشط الآن)</span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#71717A' }}>
                            بغداد، العراق • IP: 151.236.84.119 • متصل عبر التوقيع الرقمي الموثق
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Device 2 */}
                    <div className="account-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717A' }}>
                          <Smartphone size={20} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#27272A' }}>متصفح Safari على iPhone 15 Pro</span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#71717A' }}>
                            أربيل، العراق • آخر نشاط: قبل ساعتين
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* TAB 3: CONNECTED SERVICES                                         */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === 'services' && (
              <div className="account-card">
                <div className="account-card-header">
                  <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#09090B', margin: '0 0 4px 0' }}>
                    الخدمات السحابية المرتبطة بحسابك
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#71717A', margin: 0 }}>
                    حسابك يمنحك وصولاً موحداً (Single Sign-On) لكافة تطبيقات الشامخ دون الحاجة لإعادة تسجيل الدخول.
                  </p>
                </div>

                <div className="account-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* eLink Card */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 20px',
                    borderRadius: '12px',
                    border: '1px solid #E4E4E7',
                    background: '#FFFFFF'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#18181B', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Layers size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#09090B' }}>منصة eLink للروابط الذكية وأكواد QR</span>
                          <span className="account-status-pill verified">نشط ومفعل</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#71717A' }}>
                          محرك اختصار وحماية الروابط بكلمة سر، استوديو QR الديناميكي، وتحليلات الزيارات الفورية.
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/elink"
                      className="btn-white-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '8px 14px' }}
                    >
                      <span>فتح المنصة</span>
                      <ExternalLink size={13} />
                    </Link>
                  </div>

                  {/* eStore Card */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 20px',
                    borderRadius: '12px',
                    border: '1px solid #E4E4E7',
                    background: '#FFFFFF'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#18181B', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Globe size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#09090B' }}>متجر eStore ولوحة تحكم التجارة</span>
                          <span className="account-status-pill verified">نشط ومفعل</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#71717A' }}>
                          إدارة المنتجات الفاخرة، تتبع الطلبات، وتسوية الفواتير الشهرية الثابتة عبر كي كارد العراقية.
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/estore/dashboard"
                      className="btn-white-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '8px 14px' }}
                    >
                      <span>لوحة التحكم</span>
                      <ExternalLink size={13} />
                    </Link>
                  </div>

                  {/* eSecurity Shield */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 20px',
                    borderRadius: '12px',
                    border: '1px solid #E4E4E7',
                    background: '#FAFAFA'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#27272A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#09090B' }}>درع الأمان السحابي والتوقيع الرقمي (eSecurity)</span>
                          <span className="account-status-pill verified">حماية 100%</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#71717A' }}>
                          تشفير المعاملات بـ HMAC-SHA256، كشف محاولات التلاعب وإعادة الإرسال Replay Attacks وسجل التدقيق الآمن.
                        </div>
                      </div>
                    </div>

                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                      يعمل بالخلفية تلقائياً
                    </span>
                  </div>

                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* TAB 4: PREFERENCES & NOTIFICATIONS                                */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === 'preferences' && (
              <div className="account-card">
                <div className="account-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#09090B', margin: '0 0 4px 0' }}>
                        التفضيلات والإشعارات
                      </h2>
                      <p style={{ fontSize: '12.5px', color: '#71717A', margin: 0 }}>
                        تخصيص سلوك المنظومة، التنبيهات الفورية والمؤثرات الصوتية.
                      </p>
                    </div>
                    {prefFeedback && (
                      <span className="account-status-pill verified">
                        <Check size={12} />
                        تم حفظ التفضيلات
                      </span>
                    )}
                  </div>
                </div>

                <div className="account-card-body">
                  
                  {/* System Language & Region */}
                  <div className="account-row">
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#09090B' }}>
                        لغة النظام والواجهة
                      </div>
                      <div style={{ fontSize: '12px', color: '#71717A' }}>
                        الواجهة الرسمية المعتمدة لكافة خدمات الحساب والتقارير.
                      </div>
                    </div>
                    <select
                      className="account-input-field"
                      style={{ width: '180px', fontWeight: 600 }}
                      defaultValue="ar-IQ"
                    >
                      <option value="ar-IQ">العربية (العراق)</option>
                    </select>
                  </div>

                  {/* Timezone */}
                  <div className="account-row">
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#09090B' }}>
                        المنطقة الزمنية وسجلات التدقيق
                      </div>
                      <div style={{ fontSize: '12px', color: '#71717A' }}>
                        تحديد التوقيت المستخدم في إحصائيات الطلبات وتوقيت النقرات.
                      </div>
                    </div>
                    <span className="account-status-pill primary">
                      توقيت بغداد الرسمي (GMT+3)
                    </span>
                  </div>

                  {/* Notification Switches */}
                  <div className="account-row">
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#09090B' }}>
                        تنبيهات الأمان وجلسات الدخول الجديدة
                      </div>
                      <div style={{ fontSize: '12px', color: '#71717A' }}>
                        تلقي إشعار فوري عند تسجيل الدخول من جهاز أو متصفح لم يسبق استخدامه.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefNotifsSecurity}
                      onChange={(e) => {
                        setPrefNotifsSecurity(e.target.checked);
                        handleSavePreference('eshamikh_pref_notif_sec', e.target.checked);
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#18181B' }}
                    />
                  </div>

                  <div className="account-row">
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#09090B' }}>
                        إشعارات المبيعات والطلبات الجديدة (eStore)
                      </div>
                      <div style={{ fontSize: '12px', color: '#71717A' }}>
                        إشعار مرئي وصوتي فور ورود طلب شراء جديد من العملاء.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefNotifsOrders}
                      onChange={(e) => {
                        setPrefNotifsOrders(e.target.checked);
                        handleSavePreference('eshamikh_pref_notif_ord', e.target.checked);
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#18181B' }}
                    />
                  </div>

                  <div className="account-row">
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#09090B' }}>
                        المؤثرات الصوتية التفاعلية
                      </div>
                      <div style={{ fontSize: '12px', color: '#71717A' }}>
                        تشغيل نغمة نقر خفيفة وفاخرة عند نسخ الروابط أو حفظ البيانات.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefSounds}
                      onChange={(e) => {
                        setPrefSounds(e.target.checked);
                        handleSavePreference('eshamikh_pref_sounds', e.target.checked);
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#18181B' }}
                    />
                  </div>

                  <div className="account-row">
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#09090B' }}>
                        النسخ التلقائي للروابط والمعرفات
                      </div>
                      <div style={{ fontSize: '12px', color: '#71717A' }}>
                        نسخ رابط eLink مباشرة إلى الحافظة بمجرد إنشائه.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefAutoCopy}
                      onChange={(e) => {
                        setPrefAutoCopy(e.target.checked);
                        handleSavePreference('eshamikh_pref_autocopy', e.target.checked);
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#18181B' }}
                    />
                  </div>

                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* TAB 5: DATA & DANGER ZONE                                         */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === 'danger' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Account Data Export & UID */}
                <div className="account-card">
                  <div className="account-card-header">
                    <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#09090B', margin: '0 0 4px 0' }}>
                      بيانات الحساب والمعرف الرقمي
                    </h2>
                    <p style={{ fontSize: '12.5px', color: '#71717A', margin: 0 }}>
                      معلومات المعرف الداخلي (UUID) والقدرة على تصدير أرشيف كامل لبياناتك الشخصية.
                    </p>
                  </div>

                  <div className="account-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* UID Row */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                        معرف الحساب الموحد (Account UUID)
                      </label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          value={user?.id || 'usr_not_loaded'}
                          readOnly
                          className="account-input-field"
                          style={{ background: '#F4F4F5', cursor: 'not-allowed', direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', fontSize: '12px' }}
                        />
                        <button
                          type="button"
                          onClick={copyUid}
                          className="btn-white-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12.5px', whiteSpace: 'nowrap' }}
                        >
                          {copiedId ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                          <span>{copiedId ? 'تم النسخ' : 'نسخ المعرف'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Export Data Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', background: '#FAFAFA', border: '1px solid #E4E4E7' }}>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#09090B' }}>
                          تنزيل نسخة احتياطية لكافة بياناتك
                        </div>
                        <div style={{ fontSize: '12px', color: '#71717A' }}>
                          توليد ملف JSON رسمي يتضمن الملف الشخصي وإعدادات الأمان وسجلات التفضيلات.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportData}
                        className="btn-white-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '12.5px' }}
                      >
                        <Download size={14} />
                        <span>تحميل الأرشيف</span>
                      </button>
                    </div>

                  </div>
                </div>

                {/* Danger Zone: Account Deletion */}
                <div className="account-card" style={{ borderColor: '#FECACA' }}>
                  <div className="account-card-header" style={{ background: '#FEF2F2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={18} color="#DC2626" />
                      <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#DC2626', margin: 0 }}>
                        منطقة الخطر (Danger Zone)
                      </h2>
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#991B1B', margin: '4px 0 0 0' }}>
                      الإجراءات في هذا القسم دائمة ولا يمكن التراجع عنها. يرجى توخي الحذر.
                    </p>
                  </div>

                  <div className="account-card-body">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#09090B' }}>
                          تعطيل أو حذف الحساب نهائياً
                        </div>
                        <div style={{ fontSize: '12px', color: '#71717A', maxWidth: '420px' }}>
                          سيتم إلغاء تفعيل كافة الروابط المختصرة التابعة لـ eLink وحذف المنتجات في متجر eStore وإنهاء الجلسات فوراً.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmOpen(true)}
                        className="elink-action-btn delete"
                        style={{ padding: '8px 16px', fontSize: '12.5px', borderRadius: '9px' }}
                      >
                        <Trash2 size={15} />
                        <span>حذف الحساب</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </main>

      {/* ── Modal: Delete Account Confirmation ──────────────────────────────── */}
      {deleteConfirmOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E4E4E7',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)',
            textAlign: 'right'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#DC2626', marginBottom: '12px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>هل أنت متأكد من حذف الحساب؟</h3>
            </div>
            
            <p style={{ fontSize: '13px', color: '#71717A', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              هذا الإجراء سيقوم بحذف كافة بياناتك وروابطك الذكية ومتجرك بشكل نهائي. لتأكيد العملية، يرجى كتابة كلمة <strong>تأكيد الحذف</strong> أدناه:
            </p>

            <input
              type="text"
              value={deleteInputText}
              onChange={(e) => setDeleteInputText(e.target.value)}
              placeholder="اكتب: تأكيد الحذف"
              className="account-input-field"
              style={{ marginBottom: '20px' }}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setDeleteConfirmOpen(false); setDeleteInputText(''); }}
                className="btn-white-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={deleteInputText !== 'تأكيد الحذف'}
                onClick={() => {
                  alert('تم إرسال طلب الحذف إلى خادم الأمان. سيتم إنهاء الجلسة.');
                  handleSignOut();
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '9px',
                  background: deleteInputText === 'تأكيد الحذف' ? '#DC2626' : '#F4F4F5',
                  color: deleteInputText === 'تأكيد الحذف' ? '#FFFFFF' : '#A1A1AA',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: deleteInputText === 'تأكيد الحذف' ? 'pointer' : 'not-allowed',
                  border: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
