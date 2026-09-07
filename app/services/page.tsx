'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';
import SettingsModal from '@/components/SettingsModal';
import {
  Link2, ShoppingBag, Truck, FileText, ShieldCheck,
  Settings, LogOut, ChevronLeft, Search,
  Sparkles, Activity, ArrowUpRight, Cpu,
  Zap, Clock, Globe, Lock, QrCode, Terminal,
  Sliders, Layers, Server, CheckCircle2, Shield,
  Store, ShoppingCart, LayoutDashboard
} from 'lucide-react';

interface ServiceDef {
  id: string;
  name: string;
  nameAr: string;
  category: 'commerce' | 'tools' | 'security';
  description: string;
  icon: React.ReactNode;
  href: string;
  status: 'active' | 'soon';
  badge: string;
  features: string[];
}

const SERVICES: ServiceDef[] = [
  {
    id: 'elink',
    name: 'eLink',
    nameAr: 'إي لينك للروابط',
    category: 'tools',
    description: 'منظومة الروابط الذكية، استوديو QR المتجهي، حماية الروابط بكلمة سر، وتحليلات الزوار اللحظية.',
    icon: <Link2 size={22} />,
    href: '/elink',
    status: 'active',
    badge: 'نشط ومتاح',
    features: ['روابط ذكية ومحمية', 'استوديو QR فكتور عالي الدقة', 'تحليلات زيارات مشفرة GDPR', 'تكامل خادم MCP'],
  },
  {
    id: 'estore-dashboard',
    name: 'eStore Dashboard',
    nameAr: 'لوحة تحكم المتجر',
    category: 'commerce',
    description: 'لوحة إدارة متجر التجارة الإلكترونية، متابعة المبيعات، الطلبات، المخزون، وتسوية فواتير كي كارد.',
    icon: <LayoutDashboard size={22} />,
    href: '/estore/dashboard',
    status: 'active',
    badge: 'إدارة التاجر',
    features: ['مؤشرات الأداء المالي (KPIs)', 'جدول الطلبات وفلاتر المعالجة', 'تنبيهات المخزون الآلية', 'سداد اشتراك كي كارد'],
  },
  {
    id: 'estore-shop',
    name: 'eStore Client View',
    nameAr: 'واجهة متجر العملاء',
    category: 'commerce',
    description: 'واجهة متجر فاخرة بأسلوب Apple و Vercel، تتيح للزبائن تصفح المنتجات وإضافتها لسلة التسوق والشراء.',
    icon: <Store size={22} />,
    href: '/estore/shop',
    status: 'active',
    badge: 'متجر الزبائن',
    features: ['معاينة المنتجات بالأسعار الكبسولية', 'نافذة Quick-View للمواصفات', 'سلة تسوق منزلقة سريعة', 'تجربة تسوق فاخرة'],
  },
  {
    id: 'esecurity',
    name: 'eSecurity',
    nameAr: 'درع الأمان السحابي',
    category: 'security',
    description: 'بوابة الحماية والتوقيع الرقمي HMAC-SHA256 لمنع التلاعب بالطلبات وسجلات التدقيق المباشرة.',
    icon: <ShieldCheck size={22} />,
    href: '/security',
    status: 'active',
    badge: 'حماية نشطة',
    features: ['توقيع رقمي HMAC-SHA256', 'مكافحة هجمات Replay', 'سجل تدقيق الأمان الفوري', 'حظر التلاعب التلقائي'],
  },
  {
    id: 'etrack',
    name: 'eTrack',
    nameAr: 'إي تراك للوجستيات',
    category: 'commerce',
    description: 'محرك تتبع الشحنات والطرود اللوجستية في الوقت الفعلي مع إشعارات التسليم المباشرة.',
    icon: <Truck size={22} />,
    href: '/etrack',
    status: 'active',
    badge: 'تتبع حي',
    features: ['تتبع برقم البوليصة اللحظي', 'تحديثات زمنية للشاحنات', 'تقارير التسليم اليومية', 'ربط فوري بالمتاجر'],
  },
  {
    id: 'eform',
    name: 'eForm',
    nameAr: 'إي فورم للنماذج',
    category: 'tools',
    description: 'منشئ النماذج التفاعلية لجمع الاستبيانات والطلبات الخاصة مع ربط مباشر بقواعد البيانات.',
    icon: <FileText size={22} />,
    href: '/eform',
    status: 'soon',
    badge: 'قريباً',
    features: ['حقول مخصصة تفاعلية', 'تكامل Webhooks تلقائي', 'تصدير التقارير', 'حماية ضد السبام'],
  },
];

function ServicesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Settings Modal State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'account' | 'profile' | 'security' | 'preferences' | 'mcp'>('account');

  // Waffle menu
  const [waffleOpen, setWaffleOpen] = useState(false);

  // Filter and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'commerce' | 'tools' | 'security'>('all');

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (prof) setProfile(prof);
      }
      setLoading(false);
    }
    loadUser();

    // Check if openSettings parameter is present
    const openSettings = searchParams.get('openSettings');
    if (openSettings) {
      setSettingsTab(openSettings as any || 'account');
      setSettingsOpen(true);
    }
  }, [searchParams]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const filteredServices = SERVICES.filter(s => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.nameAr.includes(searchQuery) ||
                          s.description.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="white-app-container">
      {/* Pristine White Navbar */}
      <header className="white-navbar">
        <div className="white-navbar-brand">
          <Link href="/services" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#09090B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
            }}>
              <Image 
                src="/assets/shamikh-logo-white.png" 
                alt="eShamikh Logo" 
                width={24}
                height={24}
                priority 
              />
            </div>
            <div className="white-brand-text">
              <span className="white-brand-title">منظومة إشمخ السحابية</span>
              <span className="white-brand-subtitle">بوابة الخدمات والأنظمة</span>
            </div>
          </Link>
        </div>

        {/* Header Actions */}
        <div className="white-navbar-actions">
          {/* 9-Dots Waffle Menu Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setWaffleOpen(!waffleOpen)}
              className="btn-white-icon"
              title="قائمة الخدمات"
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.5px' }}>
                {[...Array(9)].map((_, i) => (
                  <div key={i} style={{ width: '3.5px', height: '3.5px', borderRadius: '1px', backgroundColor: '#09090B' }} />
                ))}
              </div>
            </button>

            {/* Waffle Dropdown */}
            {waffleOpen && (
              <div style={{
                position: 'absolute',
                top: '46px',
                left: '0',
                width: '320px',
                background: '#FFFFFF',
                border: '1px solid #E4E4E7',
                borderRadius: '16px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)',
                padding: '16px',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#71717A' }}>
                  الوصول السريع للخدمات
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {SERVICES.map(s => (
                    <Link
                      key={s.id}
                      href={s.href}
                      onClick={() => setWaffleOpen(false)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 6px',
                        borderRadius: '12px',
                        background: '#FAFAFA',
                        border: '1px solid #F1F1F4',
                        textAlign: 'center',
                        textDecoration: 'none'
                      }}
                    >
                      <div style={{ color: '#09090B' }}>{s.icon}</div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#09090B' }}>{s.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings Trigger */}
          <button
            onClick={() => { setSettingsTab('account'); setSettingsOpen(true); }}
            className="btn-white-icon"
            title="الإعدادات وخادم MCP"
          >
            <Settings size={18} />
          </button>

          {/* User Profile Avatar Pill */}
          {user && (
            <button
              onClick={() => { setSettingsTab('profile'); setSettingsOpen(true); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px 4px 6px',
                borderRadius: '9999px',
                background: '#FFFFFF',
                border: '1px solid #E4E4E7',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
            >
              <UserAvatar
                userId={user.id}
                avatarUrl={profile?.avatar_url}
                fullName={profile?.full_name || user.user_metadata?.full_name}
                email={user.email}
                size="sm"
              />
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#09090B' }}>
                {profile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        padding: '36px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
      }}>
        {/* Top Welcome & Search Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#09090B', letterSpacing: '-0.02em', margin: 0 }}>
              مركز الخدمات السحابية
            </h1>
            <p style={{ fontSize: '13.5px', color: '#71717A', marginTop: '4px' }}>
              اختر الخدمة أو المنصة السحابية التي ترغب بإدارتها أو ربطها بالذكاء الاصطناعي
            </p>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="البحث في الخدمات..."
              className="white-input"
              style={{ paddingRight: '36px', borderRadius: '12px' }}
            />
            <Search size={15} color="#71717A" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        {/* Filter Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'جميع الخدمات' },
            { id: 'commerce', label: 'التجارة والمتاجر (eStore & eTrack)' },
            { id: 'tools', label: 'الأدوات والروابط (eLink & eForm)' },
            { id: 'security', label: 'الأمان والدرع (eSecurity)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`elink-tab-btn ${selectedCategory === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px',
        }}>
          {filteredServices.map(service => (
            <Link
              key={service.id}
              href={service.href}
              className="white-card interactive"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                textDecoration: 'none',
                position: 'relative'
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  backgroundColor: '#09090B',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}>
                  {service.icon}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge-pill ${service.status === 'active' ? 'success' : 'neutral'}`}>
                    {service.badge}
                  </span>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: '#F4F4F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#71717A'
                  }}>
                    <ArrowUpRight size={15} />
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#09090B', margin: 0 }}>
                  {service.nameAr}
                  <span style={{ fontSize: '12.5px', color: '#71717A', marginRight: '8px', fontWeight: 500 }}>
                    ({service.name})
                  </span>
                </h3>
                <p style={{ fontSize: '13px', color: '#52525B', lineHeight: 1.6, marginTop: '6px' }}>
                  {service.description}
                </p>
              </div>

              {/* Feature Tags */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                paddingTop: '12px',
                borderTop: '1px solid #F1F1F4',
                marginTop: 'auto'
              }}>
                {service.features.map((feat, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '11px',
                      color: '#27272A',
                      backgroundColor: '#F4F4F5',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 500
                    }}
                  >
                    • {feat}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* MCP Banner Strip */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E4E4E7',
          borderRadius: '20px',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#F4F4F5',
              border: '1px solid #E4E4E7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#09090B'
            }}>
              <Server size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#09090B', margin: 0 }}>
                خادم eShamikh Model Context Protocol (MCP) & API
              </h4>
              <p style={{ fontSize: '12.5px', color: '#71717A', margin: '2px 0 0 0' }}>
                اربط مشاريعك الذكية (Cursor / Windsurf / Claude) مع قواعد بيانات المنظومة وأدر أدواتك برمجياً
              </p>
            </div>
          </div>

          <button
            onClick={() => { setSettingsTab('mcp'); setSettingsOpen(true); }}
            className="btn-white-secondary"
            style={{ borderRadius: '10px' }}
          >
            <span>إعدادات وتوليد مفاتيح MCP</span>
            <ChevronLeft size={16} />
          </button>
        </div>
      </main>

      {/* Settings Modal */}
      {user && (
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          user={user}
          onSignOut={handleSignOut}
          onProfileUpdated={(newProf) => setProfile(newProf)}
          defaultTab={settingsTab}
        />
      )}
    </div>
  );
}

export default function ServicesPage() {
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
        جاري تحميل بوابة الخدمات...
      </div>
    }>
      <ServicesPageContent />
    </Suspense>
  );
}
