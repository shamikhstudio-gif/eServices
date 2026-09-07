'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  Check,
  ShieldCheck,
  Truck,
  ArrowRight,
  Eye,
  CreditCard,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  Store,
  User
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  image: string;
  description: string;
  colors: string[];
  inStock: boolean;
  rating: number;
}

const PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    title: 'سماعات إشمخ اللاسلكية برو (Obsidian Edition)',
    category: 'إلكترونيات',
    price: 125000,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    description: 'صوت مكاني نقي عالي الدقة مع عزل ضوضاء متكيف نشط وبطارية تدوم حتى 36 ساعة.',
    colors: ['#09090B', '#E4E4E7', '#C5A059'],
    inStock: true,
    rating: 4.9,
  },
  {
    id: 'prod-2',
    title: 'ساعة يد رقمية ذكية الترا - سيراميك أبيض',
    category: 'إكسسوارات',
    price: 195000,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    description: 'هيكل من السيراميك الفاخر مع شاشة ريتنا فائقة السطوع ومقاومة تامة للماء حتى عمق 50 متراً.',
    colors: ['#FFFFFF', '#18181B'],
    inStock: true,
    rating: 4.8,
  },
  {
    id: 'prod-3',
    title: 'نظارة شمسية كلاسيكية عصرية بإطار تيتانيوم',
    category: 'إكسسوارات',
    price: 85000,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
    description: 'عدسات استقطابية يابانية بحماية 100% من الأشعة فوق البنفسجية وإطار فائق الخفة والمتانة.',
    colors: ['#09090B', '#C5A059'],
    inStock: true,
    rating: 4.7,
  },
  {
    id: 'prod-4',
    title: 'حقيبة سفر جلدية مدمجة فاخرة (Minimal Carry)',
    category: 'حقائب',
    price: 140000,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
    description: 'جلد طبيعي محبب مع سحابات يابانية مطلية ومقصورة مبطنة للابتوب والأجهزة اللوحية.',
    colors: ['#18181B', '#78350F'],
    inStock: true,
    rating: 5.0,
  },
  {
    id: 'prod-5',
    title: 'لوحة مفاتيح ميكانيكية لاسلكية مخصصة (Gateron Pro)',
    category: 'إلكترونيات',
    price: 110000,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
    description: 'مفاتيح ميكانيكية ناعمة مبدلة على الساخن (Hot-swap) مع اتصال بلوتوث ثلاثي الأجهزة.',
    colors: ['#FFFFFF', '#09090B'],
    inStock: true,
    rating: 4.9,
  },
  {
    id: 'prod-6',
    title: 'عطر الفخامة الأندلسي (خشب الصندل والعنبر الأبيض)',
    category: 'عطور',
    price: 95000,
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80',
    description: 'تركيبة عطرية هادئة وثابتة تدوم طوال اليوم مستخلصة من أفخر الزيوت الطبيعية.',
    colors: ['#C5A059'],
    inStock: true,
    rating: 4.8,
  },
];

interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export default function EstoreRootHomePage() {
  const [products] = useState<Product[]>(PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  // Quick View State
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(product: Product, color?: string) {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, selectedColor: color || product.colors[0] }];
    });
    setCartOpen(true);
  }

  function updateQuantity(productId: string, delta: number) {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }

  function handleCheckout() {
    if (cart.length === 0) return;
    setCheckoutComplete(true);
    setTimeout(() => {
      setCart([]);
      setCheckoutComplete(false);
      setCartOpen(false);
    }, 2800);
  }

  return (
    <div className="white-app-container" dir="rtl">
      {/* ── Top Storefront Navbar ── */}
      <header className="white-navbar">
        <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          
          {/* Brand Emblem */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#09090B',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#09090B', letterSpacing: '-0.3px' }}>eStore</span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: '#F4F4F5',
                    color: '#18181B',
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    border: '1px solid #E4E4E7'
                  }}>
                    estore.eshamikh.com
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#71717A' }}>متجر الشامخ الفاخر للتجارة الإلكترونية</span>
              </div>
            </Link>
          </div>

          {/* Search Bar & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            <div style={{ position: 'relative', width: '220px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="البحث في المعروضات..."
                className="account-input-field"
                style={{ paddingRight: '34px', fontSize: '12.5px', borderRadius: '9999px', padding: '7px 34px 7px 12px' }}
              />
              <Search size={14} color="#71717A" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Merchant Dashboard Shortcut */}
            <Link
              href="/estore/dashboard"
              className="btn-white-secondary"
              style={{ borderRadius: '9999px', fontSize: '12px', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="لوحة تحكم وإدارة المتجر"
            >
              <Store size={14} />
              <span>لوحة التاجر</span>
            </Link>

            {/* Account Settings */}
            <Link
              href="/account"
              className="btn-white-icon"
              title="إدارة الحساب والملف الشخصي"
            >
              <User size={16} />
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="btn-white-primary"
              style={{ borderRadius: '9999px', padding: '7px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ShoppingCart size={16} />
              <span>السلة</span>
              {cartItemsCount > 0 && (
                <span style={{
                  background: '#FFFFFF',
                  color: '#09090B',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  marginRight: '2px'
                }}>
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ── Main Storefront Area ── */}
      <main className="estore-container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '32px 24px 80px', width: '100%' }}>
        
        {/* Editorial Hero Banner (Apple / Vercel Store Style) */}
        <div className="estore-hero" style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
          border: '1px solid #E4E4E7',
          borderRadius: '24px',
          padding: '48px 40px',
          marginBottom: '36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 4px 20px -8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-pill gold" style={{
              background: '#FEF9C3',
              color: '#854D0E',
              border: '1px solid #FEF08A',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '11.5px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <Sparkles size={12} />
              مجموعة 2026 الحصرية • متجر الشامخ الفاخر
            </span>
          </div>

          <h1 style={{
            fontSize: '34px',
            fontWeight: 800,
            color: '#09090B',
            letterSpacing: '-0.02em',
            margin: 0,
            lineHeight: 1.3
          }}>
            أناقة متناهية ودقة مطلقة في كل التفاصيل
          </h1>

          <p style={{
            fontSize: '14.5px',
            color: '#52525B',
            lineHeight: 1.7,
            maxWidth: '680px',
            margin: 0
          }}>
            اكتشف تشكيلتنا المنتقاة بعناية فائقة. شحن سريع وموثوق إلى كافة محافظات العراق، مع ضمان الاستبدال المباشر والدفع الإلكتروني الآمن عبر بطاقات كي كارد أو عند الاستلام.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#27272A', fontWeight: 500 }}>
              <Truck size={16} color="#059669" />
              <span>توصيل سريع لكافة المحافظات</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#27272A', fontWeight: 500 }}>
              <ShieldCheck size={16} color="#059669" />
              <span>ضمان جودة eStore 100%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#27272A', fontWeight: 500 }}>
              <CreditCard size={16} color="#059669" />
              <span>دفع عبر كي كارد أو نقداً</span>
            </div>
          </div>
        </div>

        {/* Category Filters Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'جميع المعروضات' },
              { id: 'إلكترونيات', label: 'إلكترونيات' },
              { id: 'إكسسوارات', label: 'إكسسوارات وساعات' },
              { id: 'حقائب', label: 'حقائب' },
              { id: 'عطور', label: 'عطور' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  fontSize: '12.5px',
                  fontWeight: selectedCategory === tab.id ? 700 : 500,
                  background: selectedCategory === tab.id ? '#18181B' : '#FFFFFF',
                  color: selectedCategory === tab.id ? '#FFFFFF' : '#52525B',
                  border: `1px solid ${selectedCategory === tab.id ? '#18181B' : '#E4E4E7'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '13px', color: '#71717A', fontWeight: 500 }}>
            عرض {filteredProducts.length} منتج
          </span>
        </div>

        {/* Product Grid */}
        <div className="estore-product-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {filteredProducts.map(product => (
            <div key={product.id} className="estore-product-card" style={{
              background: '#FFFFFF',
              border: '1px solid #E4E4E7',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease'
            }}>
              {/* Product Image Container */}
              <div style={{ position: 'relative', height: '260px', width: '100%', overflow: 'hidden', background: '#F4F4F5' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                  loading="lazy"
                />

                {/* Floating Pill Price Badge (Apple / Vercel style) */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid #E4E4E7',
                  borderRadius: '9999px',
                  padding: '4px 12px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  color: '#09090B',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  {product.price.toLocaleString()} د.ع
                </div>
              </div>

              {/* Product Content Info */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#71717A' }}>
                      {product.category}
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#B45309', fontWeight: 700 }}>
                      ★ {product.rating}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#09090B', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                    {product.title}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#71717A', margin: 0, lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {product.description}
                  </p>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <button
                    onClick={() => addToCart(product)}
                    className="btn-white-primary"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Plus size={14} />
                    <span>إضافة للسلة</span>
                  </button>

                  <button
                    onClick={() => {
                      setQuickViewProduct(product);
                      setSelectedColor(product.colors[0]);
                    }}
                    className="btn-white-secondary"
                    style={{ padding: '8px', borderRadius: '10px' }}
                    title="معاينة سريعة"
                  >
                    <Eye size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── Slide-over Cart Drawer ── */}
      {cartOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 900,
            backgroundColor: 'rgba(9, 9, 11, 0.4)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'flex-start'
          }}
          onClick={() => setCartOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              height: '100%',
              background: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.1)'
            }}
            onClick={e => e.stopPropagation()}
            dir="rtl"
          >
            {/* Drawer Header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #E4E4E7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FAFAFA'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingCart size={20} color="#09090B" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#09090B', margin: 0 }}>
                  سلة المشتريات ({cartItemsCount})
                </h3>
              </div>

              <button
                onClick={() => setCartOpen(false)}
                className="btn-white-icon"
                style={{ width: '30px', height: '30px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {checkoutComplete ? (
                <div style={{
                  padding: '36px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '9999px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#09090B', margin: 0 }}>تم تسجيل طلبك بنجاح!</h4>
                  <p style={{ fontSize: '13px', color: '#71717A', margin: 0 }}>
                    سيصلك إشعار عبر الهاتف لتتبع الشحنة مع مندوب التوصيل في بغداد والمحافظات.
                  </p>
                </div>
              ) : cart.length > 0 ? (
                cart.map(item => (
                  <div
                    key={item.product.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid #E4E4E7',
                      background: '#FFFFFF'
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#09090B' }}>
                        {item.product.title}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', marginTop: '2px' }}>
                        {item.product.price.toLocaleString()} د.ع
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #E4E4E7', background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #E4E4E7', background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '48px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#71717A',
                  textAlign: 'center'
                }}>
                  <ShoppingBag size={36} />
                  <p style={{ fontSize: '13.5px', margin: 0 }}>سلة التسوق فارغة حالياً</p>
                  <span style={{ fontSize: '11.5px' }}>اختر منتجاً فاخراً لتجربة الشراء المباشر</span>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            {cart.length > 0 && !checkoutComplete && (
              <div style={{
                padding: '18px 22px',
                borderTop: '1px solid #E4E4E7',
                background: '#FAFAFA',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#71717A' }}>
                  <span>المجموع الفرعي:</span>
                  <span style={{ fontWeight: 700, color: '#09090B' }}>
                    {cartTotal.toLocaleString()} د.ع
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#71717A' }}>
                  <span>أجور التوصيل (كافة المحافظات):</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>مجاني (عرض إطلاق eStore)</span>
                </div>

                <div style={{ height: '1px', backgroundColor: '#E4E4E7', margin: '2px 0' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800, color: '#09090B' }}>
                  <span>الإجمالي النهائي:</span>
                  <span style={{ color: '#09090B' }}>
                    {cartTotal.toLocaleString()} د.ع
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="btn-white-primary"
                  style={{ width: '100%', padding: '13px', borderRadius: '12px', fontSize: '14px', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <CreditCard size={16} />
                  <span>إتمام الطلب والدفع المباشر</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Quick View Modal ── */}
      {quickViewProduct && (
        <div className="settings-modal-backdrop" onClick={() => setQuickViewProduct(null)} style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div
            className="settings-modal-box"
            onClick={e => e.stopPropagation()}
            dir="rtl"
            style={{
              maxWidth: '640px',
              width: '100%',
              background: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E4E4E7',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #F4F4F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#09090B' }}>
                معاينة المنتج السريعة
              </span>
              <button onClick={() => setQuickViewProduct(null)} className="btn-white-icon">
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={quickViewProduct.image}
                alt={quickViewProduct.title}
                style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '14px', border: '1px solid #E4E4E7' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{
                  width: 'fit-content',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: '#F4F4F5',
                  color: '#18181B',
                  padding: '3px 8px',
                  borderRadius: '9999px'
                }}>
                  {quickViewProduct.category}
                </span>

                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#09090B', margin: 0 }}>
                  {quickViewProduct.title}
                </h3>

                <p style={{ fontSize: '12.5px', color: '#71717A', lineHeight: 1.6, margin: 0 }}>
                  {quickViewProduct.description}
                </p>

                <div style={{ fontSize: '20px', fontWeight: 800, color: '#09090B' }}>
                  {quickViewProduct.price.toLocaleString()} د.ع
                </div>

                <button
                  onClick={() => {
                    addToCart(quickViewProduct, selectedColor);
                    setQuickViewProduct(null);
                  }}
                  className="btn-white-primary"
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Plus size={15} />
                  <span>إضافة لسلة الشراء</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
