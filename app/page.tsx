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
  Link2,
  Server,
  Compass,
  Store,
  Layers
} from 'lucide-react';

function CentralSSOContent() {
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
            .select('full_name, username, avatar_url, bio')
            .eq('id', user.id)
            .maybeSingle();
          if (prof) setUserProfile(prof);
        } catch (e) {
          console.error('Failed to load profile:', e);
        }
      }
    }
    checkSession();
  }, []);

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
        setMessage({ type: 'success', text: 'تم تسجيل الدخول بنجاح! جاري تحويل الجلسة...' });
        setCurrentUser(data.user);
        setTimeout(() => {
          window.location.href = redirectTo || '/services';
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
            role: 'member',
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
          setMessage({ type: 'success', text: 'تم إنشاء الحساب وتفعيله فورياً بنجاح!' });
        } else {
          setCurrentUser(data.user);
          setMessage({ type: 'success', text: 'تم إنشاء الحساب بنجاح وتم تفعيله سحابياً!' });
        }

        setTimeout(() => {
          window.location.href = redirectTo || '/services';
        }, 800);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: translateAuthError(err.message) });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setMessage({ type: 'success', text: 'تم تسجيل الخروج بنجاح.' });
  }

  function handleCopyUserId() {
    if (!currentUser?.id) return;
    navigator.clipboard.writeText(currentUser.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#FAFAFA',
      color: '#09090B',
      display: 'flex',
      flexDirection: 'column',
      direction: 'rtl',
    }}>
      {/* Pristine White Navbar */}
      <header className="white-navbar">
        <div className="white-navbar-brand">
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#09090B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}>
            <Image 
              src="/assets/shamikh-logo-white.png" 
              alt="eShamikh Logo" 
              width={26}
              height={26}
              priority 
            />
          </div>
          <div className="white-brand-text">
            <span className="white-brand-title">منظومة إشمخ السحابية</span>
            <span className="white-brand-subtitle">eShamikh Cloud Ecosystem</span>
          </div>
        </div>

        <div className="white-navbar-actions">
          <span className="badge-pill success">
            <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#059669' }} />
            الخدمات متصلة ونشطة
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1040px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '40px',
          alignItems: 'center',
        }}>
          
          {/* Right Hero / Branding Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E4E4E7',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              width: 'fit-content'
            }}>
              <ShieldCheck size={16} color="#059669" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#27272A' }}>
                بوابة المصادقة المركزية الموحدة (SSO)
              </span>
            </div>

            <h1 style={{
              fontSize: '36px',
              fontWeight: 800,
              color: '#09090B',
              lineHeight: 1.35,
              letterSpacing: '-0.02em',
              margin: 0,
            }}>
              منصة سحابية متكاملة <br />
              <span style={{ color: '#71717A', fontWeight: 600 }}>للتجارة، الروابط، والذكاء الاصطناعي</span>
            </h1>

            <p style={{
              fontSize: '15px',
              color: '#52525B',
              lineHeight: 1.7,
              margin: 0,
            }}>
              &quot;المشروع اللي ما تدفع بيه شوية.. مايطلع لك فلس&quot;
              <br />
              إدارة مركزية موحدة لحسابك السحابي، متاجرك، روابطك المحمية، وبروتوكولات MCP.
            </p>

            {/* Ecosystem Services Showcase Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E4E4E7',
                borderRadius: '12px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#18181B'
              }}>
                <Link2 size={16} color="#059669" />
                <span>eLink للروابط الذكية</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E4E4E7',
                borderRadius: '12px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#18181B'
              }}>
                <Store size={16} color="#C5A059" />
                <span>eStore منصة المتاجر</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E4E4E7',
                borderRadius: '12px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#18181B'
              }}>
                <Server size={16} color="#09090B" />
                <span>خادم MCP السحابي</span>
              </div>
            </div>
          </div>

          {/* Left Auth Container Card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E4E4E7',
            borderRadius: '24px',
            padding: '32px 28px',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            {/* Redirect Notice */}
            {redirectTo && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: '#F4F4F5',
                border: '1px solid #E4E4E7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px',
              }}>
                <span style={{ color: '#71717A', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ExternalLink size={13} />
                  الوجهة المطلوبة:
                </span>
                <span style={{ color: '#09090B', fontFamily: 'monospace', direction: 'ltr' }}>
                  {redirectTo}
                </span>
              </div>
            )}

            {/* Authenticated State */}
            {currentUser ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <UserAvatar
                    userId={currentUser.id}
                    avatarUrl={userProfile?.avatar_url}
                    fullName={userProfile?.full_name || currentUser.user_metadata?.full_name}
                    email={currentUser.email}
                    size="lg"
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge-pill success">
                        <ShieldCheck size={11} />
                        جلسة موثقة
                      </span>
                    </div>
                    <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#09090B', margin: 0 }}>
                      {userProfile?.full_name || currentUser.user_metadata?.full_name || 'مستخدم معتمد'}
                    </h2>
                    <p style={{ fontSize: '12px', color: '#71717A', margin: 0 }}>
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                {/* Account UID */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#FAFAFA',
                  border: '1px solid #E4E4E7',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}>
                  <span style={{ color: '#71717A' }}>معرّف الحساب:</span>
                  <span style={{ fontFamily: 'monospace', color: '#09090B', direction: 'ltr', fontSize: '11px' }}>
                    {currentUser.id.slice(0, 18)}...
                  </span>
                  <button 
                    onClick={handleCopyUserId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: copiedId ? '#059669' : '#09090B',
                      background: '#FFFFFF',
                      border: '1px solid #E4E4E7',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedId ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedId ? 'تم' : 'نسخ'}</span>
                  </button>
                </div>

                {/* Primary CTA Button */}
                <Link
                  href={redirectTo || '/services'}
                  className="btn-white-primary"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px' }}
                >
                  <Compass size={17} />
                  <span>{redirectTo ? 'المتابعة إلى الخدمة المطلوبة' : 'الانتقال إلى بوابة الخدمات السحابية'}</span>
                  <ArrowLeft size={16} />
                </Link>

                {/* Shortcuts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Link href="/elink" className="white-card interactive" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Link2 size={16} color="#09090B" />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#09090B' }}>eLink</div>
                      <div style={{ fontSize: '11px', color: '#71717A' }}>إدارة الروابط</div>
                    </div>
                  </Link>

                  <Link href="/services" className="white-card interactive" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Layers size={16} color="#09090B" />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#09090B' }}>الخدمات</div>
                      <div style={{ fontSize: '11px', color: '#71717A' }}>جميع الأدوات</div>
                    </div>
                  </Link>
                </div>

                {/* Signout Button */}
                <button
                  onClick={handleSignOut}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '9px',
                    borderRadius: '10px',
                    color: '#DC2626',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '6px'
                  }}
                >
                  <LogOut size={14} />
                  <span>تسجيل الخروج من الجلسة</span>
                </button>
              </div>
            ) : (
              /* Auth Tabs and Form */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Clean Mode Switcher Tabs */}
                <div style={{
                  display: 'flex',
                  backgroundColor: '#F4F4F5',
                  padding: '4px',
                  borderRadius: '12px',
                  border: '1px solid #E4E4E7'
                }}>
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setMessage(null); }}
                    style={{
                      flex: 1,
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: mode === 'signin' ? '#09090B' : '#71717A',
                      backgroundColor: mode === 'signin' ? '#FFFFFF' : 'transparent',
                      boxShadow: mode === 'signin' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    تسجيل الدخول
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setMessage(null); }}
                    style={{
                      flex: 1,
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: mode === 'signup' ? '#09090B' : '#71717A',
                      backgroundColor: mode === 'signup' ? '#FFFFFF' : 'transparent',
                      boxShadow: mode === 'signup' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    إنشاء حساب جديد
                  </button>
                </div>

                {/* Alert Messages */}
                {message && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                    color: message.type === 'success' ? '#059669' : '#DC2626',
                  }}>
                    {message.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                    <span>{message.text}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {mode === 'signup' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                        الاسم الكامل
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="الاسم الكريم"
                          className="white-input"
                          style={{ paddingRight: '38px' }}
                        />
                        <User size={15} color="#71717A" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                      البريد الإلكتروني
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="white-input"
                        style={{ paddingRight: '38px', direction: 'ltr', textAlign: 'right' }}
                      />
                      <Mail size={15} color="#71717A" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#27272A' }}>
                        كلمة المرور
                      </label>
                      {mode === 'signup' && (
                        <span style={{ fontSize: '11px', color: '#71717A' }}>6 أحرف على الأقل</span>
                      )}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="white-input"
                        style={{ paddingRight: '38px', paddingLeft: '38px', direction: 'ltr' }}
                      />
                      <Lock size={15} color="#71717A" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#71717A',
                          cursor: 'pointer'
                        }}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-white-primary"
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', marginTop: '6px' }}
                  >
                    {loading ? (
                      <span>جاري المعالجة...</span>
                    ) : (
                      <>
                        <span>{mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء الحساب فورياً'}</span>
                        {mode === 'signin' ? <ArrowLeft size={16} /> : <Sparkles size={16} />}
                      </>
                    )}
                  </button>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '11.5px',
                    color: '#71717A',
                    marginTop: '4px'
                  }}>
                    <ShieldCheck size={14} color="#059669" />
                    <span>اتصال سحابي آمن ومشفر بالكامل</span>
                  </div>
                </form>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default function CentralSSOHomePage() {
  return (
    <Suspense fallback={
      <div style={{
        height: '100dvh',
        backgroundColor: '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#71717A',
        fontSize: '14px',
        direction: 'rtl'
      }}>
        جاري تهيئة البوابة السحابية...
      </div>
    }>
      <CentralSSOContent />
    </Suspense>
  );
}
