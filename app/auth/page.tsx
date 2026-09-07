'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';
import { 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  ArrowLeft,
  Sparkles,
  Store,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

function CentralAuthContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect_to');

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function checkSession() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name, username, avatar_url, bio, store_name')
            .eq('id', user.id)
            .maybeSingle();
          if (prof) setUserProfile(prof);
        } catch (e) {
          console.error('Failed to load profile:', e);
        }
      }
    }
    checkSession();
  }, [supabase]);

  function translateAuthError(errorMessage: string): string {
    if (!errorMessage) return 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.';
    const msg = errorMessage.toLowerCase();
    if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
      return 'بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور.';
    }
    if (msg.includes('user already registered') || msg.includes('already registered')) {
      return 'هذا البريد الإلكتروني مسجل بالفعل، يمكنك تسجيل الدخول مباشرة.';
    }
    if (msg.includes('password should be at least') || msg.includes('password is too short')) {
      return 'يجب أن تتكون كلمة المرور من 6 أحرف أو أرقام على الأقل.';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'تم تجاوز الحد المسموح من المحاولات، يرجى الانتظار قليلاً.';
    }
    if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
      return 'صيغة البريد الإلكتروني غير صالحة، يرجى إدخال بريد صحيح.';
    }
    return 'حدث خطأ أثناء معالجة الطلب، يرجى المحاولة لاحقاً.';
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage({ type: 'error', text: translateAuthError(error.message) });
      } else {
        setMessage({ type: 'success', text: 'تم تسجيل الدخول بنجاح! جاري تحويلك إلى لوحة المتجر...' });
        setCurrentUser(data.user);
        setTimeout(() => {
          window.location.href = redirectTo || '/estore/dashboard';
        }, 600);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: translateAuthError(err.message) });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'merchant',
          },
        },
      });

      if (error) {
        setMessage({ type: 'error', text: translateAuthError(error.message) });
      } else {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (!loginError && loginData?.user) {
          setCurrentUser(loginData.user);
          setMessage({ type: 'success', text: 'تم إنشاء وتفعيل حساب التاجر فورياً بنجاح!' });
        } else {
          setCurrentUser(data.user);
          setMessage({ type: 'success', text: 'تم إنشاء حساب التاجر بنجاح!' });
        }

        setTimeout(() => {
          window.location.href = redirectTo || '/estore/dashboard';
        }, 800);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: translateAuthError(err.message) });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUserProfile(null);
    setLoading(false);
    setMessage({ type: 'success', text: 'تم تسجيل الخروج بنجاح من متجر eStore.' });
  }

  function copyUserId() {
    if (!currentUser?.id) return;
    navigator.clipboard.writeText(currentUser.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  return (
    <div className="white-app-container flex flex-col justify-between" dir="rtl" style={{ minHeight: '100vh', background: '#FAFAFA' }}>
      
      {/* ── Top Brand Bar ── */}
      <header className="white-navbar">
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#09090B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px'
            }}>
              e
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#09090B', letterSpacing: '-0.3px' }}>eStore</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  background: '#F4F4F5',
                  color: '#18181B',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid #E4E4E7'
                }}>
                  estore.eshamikh.com
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#71717A' }}>منصة التجارة الإلكترونية الفاخرة</div>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/"
              className="btn-white-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '7px 14px' }}
            >
              <ShoppingBag size={14} />
              <span>عرض المتجر</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Auth Card ── */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          
          <div className="white-card" style={{ padding: '32px 28px', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.06)' }}>
            
            {currentUser ? (
              /* Already Logged In Session View */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <UserAvatar
                    userId={currentUser.id}
                    avatarUrl={userProfile?.avatar_url}
                    fullName={userProfile?.full_name || currentUser.user_metadata?.full_name}
                    email={currentUser.email}
                    size="lg"
                  />
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#09090B', margin: '0 0 4px 0' }}>
                      {userProfile?.full_name || currentUser.user_metadata?.full_name || 'حساب التاجر المعتمد'}
                    </h2>
                    <p style={{ fontSize: '12.5px', color: '#71717A', margin: 0, direction: 'ltr' }}>
                      {currentUser.email}
                    </p>
                  </div>
                  <span className="account-status-pill verified">
                    تاجر eStore معتمد
                  </span>
                </div>

                <div style={{ borderTop: '1px solid #F4F4F5', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Link
                    href={redirectTo || '/estore/dashboard'}
                    className="btn-white-primary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '13.5px', width: '100%', textDecoration: 'none' }}
                  >
                    <Store size={16} />
                    <span>الدخول إلى لوحة تحكم المتجر (Dashboard)</span>
                    <ArrowLeft size={16} />
                  </Link>

                  <Link
                    href="/"
                    className="btn-white-secondary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', fontSize: '13px', width: '100%', textDecoration: 'none' }}
                  >
                    <ShoppingBag size={15} />
                    <span>تصفح متجر الزبائن الفاخر</span>
                  </Link>

                  <Link
                    href="/account"
                    className="btn-white-secondary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', fontSize: '13px', width: '100%', textDecoration: 'none' }}
                  >
                    <User size={15} />
                    <span>إدارة حساب التاجر والأمان</span>
                  </Link>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #F4F4F5' }}>
                  <button
                    onClick={copyUserId}
                    style={{ fontSize: '11.5px', color: '#71717A', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedId ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                    <span>{copiedId ? 'تم نسخ المعرف' : 'نسخ معرّف الحساب'}</span>
                  </button>

                  <button
                    onClick={handleSignOut}
                    disabled={loading}
                    style={{ fontSize: '12px', color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <LogOut size={13} />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Sign In / Sign Up Form */
              <div>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: '#18181B',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px',
                    boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)'
                  }}>
                    <Store size={24} />
                  </div>
                  <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#09090B', margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>
                    {mode === 'signin' ? 'تسجيل دخول التاجر' : 'إنشاء حساب تاجر جديد'}
                  </h1>
                  <p style={{ fontSize: '12.5px', color: '#71717A', margin: 0 }}>
                    {mode === 'signin'
                      ? 'أدخل بيانات حسابك للوصول إلى لوحة إدارة متجر eStore ومتابعة المبيعات'
                      : 'ابدأ إدارة متجرك الإلكتروني الفاخر وربط فواتير كي كارد العراقية فوراً'}
                  </p>
                </div>

                {message && (
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    marginBottom: '18px',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    color: message.type === 'success' ? '#059669' : '#DC2626',
                    border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`
                  }}>
                    {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{message.text}</span>
                  </div>
                )}

                <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {mode === 'signup' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                        الاسم الكامل للتاجر
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="مثال: علي الشامخ"
                          required
                          className="account-input-field"
                          style={{ paddingRight: '36px' }}
                        />
                        <User size={16} style={{ position: 'absolute', right: '12px', top: '12px', color: '#A1A1AA' }} />
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                      البريد الإلكتروني المعتمد
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="merchant@store.com"
                        required
                        className="account-input-field"
                        style={{ paddingRight: '36px', direction: 'ltr', textAlign: 'right' }}
                      />
                      <Mail size={16} style={{ position: 'absolute', right: '12px', top: '12px', color: '#A1A1AA' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                      كلمة المرور
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="account-input-field"
                        style={{ paddingRight: '36px', paddingLeft: '36px', direction: 'ltr' }}
                      />
                      <Lock size={16} style={{ position: 'absolute', right: '12px', top: '12px', color: '#A1A1AA' }} />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', left: '12px', top: '12px', color: '#71717A' }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-white-primary"
                    style={{
                      padding: '12px',
                      fontSize: '13.5px',
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{loading ? 'جاري التحقق...' : mode === 'signin' ? 'تسجيل الدخول إلى المتجر' : 'تأكيد التسجيل وبدء المتجر'}</span>
                    <ArrowLeft size={16} />
                  </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '16px', borderTop: '1px solid #F4F4F5' }}>
                  {mode === 'signin' ? (
                    <span style={{ fontSize: '12.5px', color: '#71717A' }}>
                      ليس لديك متجر مسجل بعد؟{' '}
                      <button
                        type="button"
                        onClick={() => { setMode('signup'); setMessage(null); }}
                        style={{ fontWeight: 700, color: '#09090B', textDecoration: 'underline' }}
                      >
                        إنشاء حساب تاجر جديد
                      </button>
                    </span>
                  ) : (
                    <span style={{ fontSize: '12.5px', color: '#71717A' }}>
                      لديك حساب تاجر مسجل بالفعل؟{' '}
                      <button
                        type="button"
                        onClick={() => { setMode('signin'); setMessage(null); }}
                        style={{ fontWeight: 700, color: '#09090B', textDecoration: 'underline' }}
                      >
                        تسجيل الدخول هنا
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

          </div>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11.5px', color: '#A1A1AA' }}>
            منظومة eStore محمية بنظام تشفير المعاملات وتوقيع الأمان الرقمي المعتمد • estore.eshamikh.com
          </div>
        </div>
      </main>

    </div>
  );
}

export default function CentralAuthPage() {
  return (
    <Suspense fallback={
      <div className="white-app-container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div style={{ color: '#71717A', fontSize: '13px' }}>جاري التحميل...</div>
      </div>
    }>
      <CentralAuthContent />
    </Suspense>
  );
}
