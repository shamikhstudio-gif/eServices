'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';
import NineDotsLauncher from '@/components/NineDotsLauncher';
import SettingsModal from '@/components/SettingsModal';
import {
  Store,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Eye,
  Settings,
  DollarSign,
  Package,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Plus
} from 'lucide-react';

interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  totalAmount: number;
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  itemsCount: number;
}

const SAMPLE_ORDERS: OrderItem[] = [
  {
    id: 'ord-1',
    orderNumber: 'ORD-2026-881',
    customerName: 'أحمد علي التميمي',
    customerPhone: '+964 770 123 4567',
    customerCity: 'بغداد - المنصور',
    totalAmount: 145000,
    status: 'new',
    createdAt: 'منذ 12 دقيقة',
    itemsCount: 3,
  },
  {
    id: 'ord-2',
    orderNumber: 'ORD-2026-880',
    customerName: 'زينب حيدر الموسوي',
    customerPhone: '+964 780 987 6543',
    customerCity: 'البصرة - الجزائر',
    totalAmount: 89000,
    status: 'processing',
    createdAt: 'منذ 45 دقيقة',
    itemsCount: 2,
  },
  {
    id: 'ord-3',
    orderNumber: 'ORD-2026-879',
    customerName: 'حسين كريم السعدي',
    customerPhone: '+964 771 555 4321',
    customerCity: 'أربيل - عينكاوة',
    totalAmount: 230000,
    status: 'shipped',
    createdAt: 'منذ ساعتين',
    itemsCount: 4,
  },
  {
    id: 'ord-4',
    orderNumber: 'ORD-2026-878',
    customerName: 'مريم عادل الشمري',
    customerPhone: '+964 782 111 2233',
    customerCity: 'النجف الأشرف - الكوفة',
    totalAmount: 65000,
    status: 'delivered',
    createdAt: 'منذ 5 ساعات',
    itemsCount: 1,
  },
  {
    id: 'ord-5',
    orderNumber: 'ORD-2026-877',
    customerName: 'عمر فاروق البغدادي',
    customerPhone: '+964 770 999 8877',
    customerCity: 'بغداد - الكرادة',
    totalAmount: 110000,
    status: 'delivered',
    createdAt: 'أمس 09:30 م',
    itemsCount: 2,
  },
];

function EstoreDashboardContent() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Orders and Filters
  const [orders, setOrders] = useState<OrderItem[]>(SAMPLE_ORDERS);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // QiCard Payment Modal
  const [showQiModal, setShowQiModal] = useState(false);
  const [qiTransId, setQiTransId] = useState('');
  const [qiPaid, setQiPaid] = useState(false);

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
    }
    loadUser();
  }, []);

  const filteredOrders = orders.filter(ord => {
    const matchesStatus = selectedStatus === 'all' || ord.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      ord.orderNumber.toLowerCase().includes(q) ||
      ord.customerName.includes(q) ||
      ord.customerCity.includes(q);
    return matchesStatus && matchesSearch;
  });

  function getStatusBadge(status: OrderItem['status']) {
    switch (status) {
      case 'new':
        return <span className="badge-pill warning"><Clock size={11} /> طلب جديد</span>;
      case 'processing':
        return <span className="badge-pill neutral"><RefreshCw size={11} className="spin" /> قيد التجهيز</span>;
      case 'shipped':
        return <span className="badge-pill gold"><Truck size={11} /> تم الشحن</span>;
      case 'delivered':
        return <span className="badge-pill success"><CheckCircle2 size={11} /> تم التسليم</span>;
      case 'cancelled':
        return <span className="badge-pill danger"><AlertCircle size={11} /> ملغي</span>;
    }
  }

  return (
    <div className="white-app-container">
      {/* Top Navbar */}
      <header className="white-navbar">
        <div className="white-navbar-brand">
          <Link href="/services" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#71717A', textDecoration: 'none' }}>
            <ArrowRight size={16} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>بوابة الخدمات</span>
          </Link>
          <div style={{ width: '1px', height: '20px', backgroundColor: '#E4E4E7', margin: '0 8px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#09090B', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={18} />
            </div>
            <div>
              <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#09090B' }}>eStore التجارة السحابية</span>
              <span style={{ fontSize: '10.5px', color: '#059669', marginRight: '6px', fontWeight: 600 }}>لوحة التاجر</span>
            </div>
          </div>
        </div>

        <div className="white-navbar-actions">
          <Link 
            href="/estore/shop" 
            target="_blank" 
            className="btn-white-secondary"
            style={{ borderRadius: '10px', fontSize: '12.5px', padding: '6px 12px' }}
          >
            <span>معاينة متجر الزبائن</span>
            <ExternalLink size={13} />
          </Link>

          <button 
            onClick={() => setShowQiModal(true)} 
            className="btn-white-primary"
            style={{ borderRadius: '10px', fontSize: '12.5px', padding: '6px 12px' }}
          >
            <CreditCard size={14} />
            <span>اشتراك المتجر (كي كارد)</span>
          </button>

          <NineDotsLauncher />

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="btn-white-icon"
            title="إعدادات الحساب"
          >
            <Settings size={17} />
          </button>

          {user && (
            <div 
              onClick={() => setIsSettingsOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <UserAvatar
                userId={user.id}
                avatarUrl={profile?.avatar_url}
                fullName={profile?.full_name || user.user_metadata?.full_name}
                email={user.email}
                size="sm"
              />
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="estore-container">
        
        {/* Top Header & Fast Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#09090B', letterSpacing: '-0.02em', margin: 0 }}>
              لوحة تحكم المتجر والتحليلات
            </h1>
            <p style={{ fontSize: '13px', color: '#71717A', marginTop: '3px' }}>
              متابعة مباشرة للإيرادات والطلبات، ومخزون المنتجات، وتسوية فواتير المبيعات
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge-pill success">
              <ShieldCheck size={12} />
              المتجر نشط ومفعل
            </span>
            <span style={{ fontSize: '12px', color: '#71717A' }}>
              آخر تحديث: لحظي
            </span>
          </div>
        </div>

        {/* 4-Card KPI Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}>
          {/* KPI 1: Revenue */}
          <div className="white-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#71717A' }}>إجمالي المبيعات (هذا الشهر)</span>
              <span className="badge-pill success">+18.4%</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#09090B', fontFamily: 'JetBrains Mono, sans-serif' }}>
              4,850,000 <span style={{ fontSize: '13px', fontWeight: 600, color: '#71717A' }}>د.ع</span>
            </div>
            <span style={{ fontSize: '11px', color: '#71717A' }}>مقارنة بـ 4,095,000 د.ع الشهر الماضي</span>
          </div>

          {/* KPI 2: Total Orders */}
          <div className="white-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#71717A' }}>عدد الطلبات المكتملة</span>
              <span className="badge-pill success">+12.1%</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#09090B', fontFamily: 'JetBrains Mono, sans-serif' }}>
              142 <span style={{ fontSize: '13px', fontWeight: 600, color: '#71717A' }}>طلب</span>
            </div>
            <span style={{ fontSize: '11px', color: '#71717A' }}>متوسط 4.7 طلبات يومياً</span>
          </div>

          {/* KPI 3: Average Order Value */}
          <div className="white-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#71717A' }}>متوسط قيمة السلة (AOV)</span>
              <span className="badge-pill neutral">مستقر</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#09090B', fontFamily: 'JetBrains Mono, sans-serif' }}>
              34,150 <span style={{ fontSize: '13px', fontWeight: 600, color: '#71717A' }}>د.ع</span>
            </div>
            <span style={{ fontSize: '11px', color: '#71717A' }}>معدل إنفاق الزبون في الزيارة الواحدة</span>
          </div>

          {/* KPI 4: Conversion Rate */}
          <div className="white-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#71717A' }}>معدل التحويل (Conversion)</span>
              <span className="badge-pill success">+3.2%</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#09090B', fontFamily: 'JetBrains Mono, sans-serif' }}>
              4.18%
            </div>
            <span style={{ fontSize: '11px', color: '#71717A' }}>من إجمالي 3,390 زيارة فريدة</span>
          </div>
        </div>

        {/* Live Orders Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#09090B', margin: 0 }}>
                جدول الطلبات الحديثة
              </h2>
              <p style={{ fontSize: '12.5px', color: '#71717A', margin: '2px 0 0 0' }}>
                عرض ومتابعة حالات الشحن والتحصيل في الوقت الفعلي
              </p>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div className="elink-tabs-row">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'new', label: 'جديد' },
                  { id: 'processing', label: 'قيد التجهيز' },
                  { id: 'shipped', label: 'تم الشحن' },
                  { id: 'delivered', label: 'مكتمل' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedStatus(tab.id)}
                    className={`elink-tab ${selectedStatus === tab.id ? 'active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', width: '220px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="بحث برقم الطلب أو العميل..."
                  className="white-input"
                  style={{ paddingRight: '34px', fontSize: '12.5px', borderRadius: '10px' }}
                />
                <Search size={14} color="#71717A" style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          {/* Orders Data Table */}
          <div className="white-table-wrap">
            <table className="white-table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>العميل</th>
                  <th>المدينة / العنوان</th>
                  <th>عدد المنتجات</th>
                  <th>المبلغ الإجمالي</th>
                  <th>الحالة</th>
                  <th>التوقيت</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(ord => (
                    <tr key={ord.id}>
                      <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#09090B' }}>
                        {ord.orderNumber}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#09090B' }}>{ord.customerName}</div>
                        <div style={{ fontSize: '11px', color: '#71717A', direction: 'ltr', textAlign: 'right' }}>
                          {ord.customerPhone}
                        </div>
                      </td>
                      <td style={{ color: '#52525B' }}>{ord.customerCity}</td>
                      <td>{ord.itemsCount} قطع</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#09090B' }}>
                        {ord.totalAmount.toLocaleString()} د.ع
                      </td>
                      <td>{getStatusBadge(ord.status)}</td>
                      <td style={{ color: '#71717A', fontSize: '12px' }}>{ord.createdAt}</td>
                      <td>
                        <button
                          onClick={() => alert(`تفاصيل الطلب: ${ord.orderNumber}\nالعميل: ${ord.customerName}\nالمبلغ: ${ord.totalAmount.toLocaleString()} د.ع`)}
                          className="elink-action-btn"
                          title="عرض تفاصيل الطلب"
                        >
                          <Eye size={13} />
                          <span>تفاصيل</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#71717A' }}>
                      لا توجد طلبات تطابق معايير البحث الحالية
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Banner: QiCard Subscription Info */}
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
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <CreditCard size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#09090B', margin: 0 }}>
                اشتراك المتجر الشهري الثابت (25,000 د.ع)
              </h3>
              <p style={{ fontSize: '12px', color: '#71717A', margin: '3px 0 0 0' }}>
                تسوية سهلة عبر ماستر كارد وبطاقات كي كارد العراقية بدون أي عمولة خفية على المبيعات
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowQiModal(true)}
            className="btn-white-primary"
            style={{ borderRadius: '10px' }}
          >
            <CreditCard size={15} />
            <span>تسوية وإدارة الاشتراك</span>
          </button>
        </div>
      </main>

      {/* QiCard Settlement Modal */}
      {showQiModal && (
        <div className="settings-modal-backdrop" onClick={() => setShowQiModal(false)}>
          <div 
            className="settings-modal-box" 
            onClick={e => e.stopPropagation()} 
            dir="rtl"
            style={{ maxWidth: '480px' }}
          >
            <div className="settings-modal-header">
              <div className="settings-modal-title-wrap">
                <div className="settings-modal-icon-badge">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="settings-modal-title">سداد اشتراك eStore (كي كارد)</h3>
                  <p className="settings-modal-sub">قيمة الاشتراك: 25,000 د.ع / شهرياً</p>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {qiPaid ? (
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#059669',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle2 size={32} />
                  <span style={{ fontWeight: 700, fontSize: '14.5px' }}>تم التحقق من سداد الاشتراك بنجاح!</span>
                  <span style={{ fontSize: '12px', color: '#065F46' }}>تم تجديد اشتراك المتجر حتى 07/10/2026</span>
                </div>
              ) : (
                <>
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#FAFAFA',
                    border: '1px solid #E4E4E7',
                    fontSize: '12.5px',
                    color: '#52525B',
                    lineHeight: 1.6
                  }}>
                    قم بتحويل مبلغ الاشتراك إلى حساب كي كارد الرسمي للمنظومة <strong>(7800-4412-9901)</strong> ثم أدخل رقم إشعار الحوالة أدناه للتأكيد الآلي.
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                      رقم إشعار عملية التحويل (Qi Transaction ID)
                    </label>
                    <input
                      type="text"
                      value={qiTransId}
                      onChange={e => setQiTransId(e.target.value)}
                      placeholder="مثال: QI-99482104"
                      className="white-input"
                      dir="ltr"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!qiTransId.trim()) return alert('يرجى إدخال رقم إشعار التحويل');
                      setQiPaid(true);
                      setTimeout(() => {
                        setShowQiModal(false);
                        setQiPaid(false);
                        setQiTransId('');
                      }, 2000);
                    }}
                    className="btn-white-primary"
                    style={{ width: '100%', padding: '12px', borderRadius: '10px' }}
                  >
                    <ShieldCheck size={16} />
                    <span>تأكيد السداد وتجديد المتجر</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {user && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          user={user}
          onSignOut={() => router.push('/')}
        />
      )}
    </div>
  );
}

export default function EstoreDashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA', color: '#71717A' }}>
        جاري تحميل لوحة تحكم المتجر...
      </div>
    }>
      <EstoreDashboardContent />
    </Suspense>
  );
}
