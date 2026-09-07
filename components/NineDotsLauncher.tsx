'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Link2, 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  ExternalLink,
  Sparkles,
  Search,
  CheckCircle2
} from 'lucide-react';

export interface ServiceItem {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  category: 'core' | 'commerce' | 'security' | 'tools';
  status: 'active' | 'coming_soon';
  icon: React.ReactNode;
  href: string;
  accentColor: string;
}

export const ESERVICES_LIST: ServiceItem[] = [
  {
    id: 'estore-shop',
    name: 'متجر eStore',
    nameEn: 'Luxury Storefront',
    description: 'واجهة متجر الزبائن الفاخر واستعراض المنتجات والسلة',
    category: 'commerce',
    status: 'active',
    icon: <ShoppingBag size={20} />,
    href: '/',
    accentColor: '#FFFFFF',
  },
  {
    id: 'estore-dashboard',
    name: 'لوحة التاجر',
    nameEn: 'Merchant Dashboard',
    description: 'إدارة مبيعات المتجر، الطلبات، والمخزون وتسوية كي كارد',
    category: 'commerce',
    status: 'active',
    icon: <CreditCard size={20} />,
    href: '/estore/dashboard',
    accentColor: '#FFFFFF',
  },
  {
    id: 'account',
    name: 'إدارة الحساب',
    nameEn: 'Merchant Identity',
    description: 'إدارة بيانات التاجر، الأمان، الجلسات، وتصدير البيانات',
    category: 'core',
    status: 'active',
    icon: <ShieldCheck size={20} />,
    href: '/account',
    accentColor: '#FFFFFF',
  },
  {
    id: 'eshield',
    name: 'eShield',
    nameEn: 'Security & SSO',
    description: 'درع المصادقة المركزية الموحدة وحماية الهوية السحابية',
    category: 'security',
    status: 'active',
    icon: <ShieldCheck size={20} />,
    href: '/services#eshield',
    accentColor: '#FFFFFF',
  },
  {
    id: 'epay',
    name: 'ePay',
    nameEn: 'Qi Card & Payments',
    description: 'بوابة الدفع والتحصيل الإلكتروني لبطاقات كي كارد وماستر كارد',
    category: 'commerce',
    status: 'coming_soon',
    icon: <CreditCard size={20} />,
    href: '#',
    accentColor: '#A1A1AA',
  },
  {
    id: 'eform',
    name: 'eForm',
    nameEn: 'Smart Surveys & Forms',
    description: 'منشئ الاستمارات والنماذج التفاعلية وجمع البيانات الذكي',
    category: 'tools',
    status: 'coming_soon',
    icon: <FileText size={20} />,
    href: '#',
    accentColor: '#A1A1AA',
  },
];

interface NineDotsLauncherProps {
  onSelectService?: (serviceId: string) => void;
}

export default function NineDotsLauncher({ onSelectService }: NineDotsLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredServices = ESERVICES_LIST.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* 9-Dots Launcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="تطبيقات وخدمات eShamikh"
        aria-label="eShamikh Apps"
        aria-expanded={isOpen}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          backgroundColor: isOpen ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${isOpen ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          color: '#FFFFFF',
          boxShadow: isOpen ? '0 0 16px rgba(255, 255, 255, 0.12)' : 'none',
        }}
      >
        {/* Custom 9 Dots SVG Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 4.5px)',
          gridTemplateRows: 'repeat(3, 4.5px)',
          gap: '3.5px',
        }}>
          {[...Array(9)].map((_, i) => (
            <span
              key={i}
              style={{
                width: '4.5px',
                height: '4.5px',
                borderRadius: '50%',
                backgroundColor: isOpen ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      </button>

      {/* Floating Glass Waffle Menu Popover */}
      {isOpen && (
        <div 
          className="waffle-popover-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            left: 0,
            width: '340px',
            maxHeight: '480px',
            backgroundColor: 'rgba(14, 14, 18, 0.92)',
            backdropFilter: 'blur(32px) saturate(200%)',
            WebkitBackdropFilter: 'blur(32px) saturate(200%)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: '20px',
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.95), 0 0 30px rgba(255, 255, 255, 0.05)',
            zIndex: 100,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            direction: 'rtl',
            textAlign: 'right',
            animation: 'wafflePopIn 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                تطبيقات المنظومة السحابية
              </span>
            </div>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontWeight: 600,
            }}>
              3 خدمات مفعلة
            </span>
          </div>

          {/* Quick Filter Search inside Launcher */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث في الخدمات..."
              style={{
                width: '100%',
                padding: '7px 32px 7px 10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                color: '#FFFFFF',
                fontSize: '12px',
                outline: 'none',
                direction: 'rtl',
              }}
            />
            <Search size={13} color="#71717A" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Grid of Apps */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            overflowY: 'auto',
            maxHeight: '340px',
            paddingLeft: '2px',
          }}>
            {filteredServices.map((service) => {
              const isActive = service.status === 'active';
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    if (onSelectService) onSelectService(service.id);
                    setIsOpen(false);
                  }}
                  disabled={!isActive}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '12px',
                    borderRadius: '14px',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.015)',
                    border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)'}`,
                    textAlign: 'right',
                    cursor: isActive ? 'pointer' : 'default',
                    opacity: isActive ? 1 : 0.45,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.09)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.28)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {/* Status Indicator */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    marginBottom: '8px',
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.09)' : 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isActive ? '#FFFFFF' : '#71717A',
                    }}>
                      {service.icon}
                    </div>

                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '9999px',
                      backgroundColor: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                      color: isActive ? '#10B981' : '#71717A',
                      border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
                    }}>
                      {isActive ? 'نشط' : 'قريباً'}
                    </span>
                  </div>

                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>
                    {service.name}
                  </span>
                  <span style={{ fontSize: '10px', color: '#71717A', lineHeight: 1.3, maxHeight: '26px', overflow: 'hidden' }}>
                    {service.nameEn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#71717A',
          }}>
            <span>بوابة الخدمات السحابية</span>
            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>eShamikh OS</span>
          </div>
        </div>
      )}
    </div>
  );
}
