'use client';

import React, { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Camera, Loader2 } from 'lucide-react';

interface UserAvatarProps {
  userId: string;
  avatarUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  onAvatarUpdated?: (newUrl: string) => void;
}

const SIZES = {
  sm: { container: 32, text: 13, ring: 2 },
  md: { container: 44, text: 17, ring: 2 },
  lg: { container: 64, text: 24, ring: 3 },
  xl: { container: 96, text: 36, ring: 3 },
};

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return '?';
}

function getGradient(seed: string): string {
  const gradients = [
    'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
    'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
    'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    'linear-gradient(135deg, #27272a 0%, #3f3f46 100%)',
    'linear-gradient(135deg, #047857 0%, #059669 100%)',
    'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export default function UserAvatar({
  userId,
  avatarUrl,
  fullName,
  email,
  size = 'md',
  editable = false,
  onAvatarUpdated,
}: UserAvatarProps) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(avatarUrl || null);

  const dim = SIZES[size];
  const initials = getInitials(fullName, email);
  const gradient = getGradient(userId || email || 'default');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError('الحد الأقصى لحجم الصورة هو 5 ميغابايت');
      return;
    }
    
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setError('يُرجى رفع صورة بصيغة JPEG أو PNG أو WebP أو GIF');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${userId}/avatar.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      // Add cache buster
      const urlWithBust = `${publicUrl}?t=${Date.now()}`;
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithBust })
        .eq('id', userId);

      if (profileError) throw profileError;

      setLocalUrl(urlWithBust);
      onAvatarUpdated?.(urlWithBust);
    } catch (err: any) {
      setError('فشل رفع الصورة. يُرجى المحاولة مرة أخرى.');
      console.error('Avatar upload error:', err);
    } finally {
      setUploading(false);
    }
  }

  const currentUrl = localUrl;

  return (
    <div className="user-avatar-root" style={{ position: 'relative', display: 'inline-block' }}>
      <div
        className="user-avatar-ring"
        style={{
          width: dim.container + dim.ring * 2,
          height: dim.container + dim.ring * 2,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
          padding: dim.ring,
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: dim.container,
            height: dim.container,
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'relative',
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {currentUrl ? (
            <img
              src={currentUrl}
              alt={fullName || email || 'User avatar'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span
              style={{
                fontSize: dim.text,
                fontWeight: 600,
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.03em',
                userSelect: 'none',
              }}
            >
              {initials}
            </span>
          )}

          {/* Editable overlay */}
          {editable && (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.55)',
                border: 'none',
                borderRadius: '50%',
                cursor: uploading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s ease',
              }}
              className="avatar-edit-btn"
            >
              {uploading ? (
                <Loader2 size={dim.container * 0.35} color="white" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Camera size={dim.container * 0.35} color="white" />
              )}
            </button>
          )}
        </div>
      </div>

      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}

      {error && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 11,
            whiteSpace: 'nowrap',
            zIndex: 100,
            direction: 'rtl',
          }}
        >
          {error}
        </div>
      )}

      <style jsx>{`
        .user-avatar-root:hover .avatar-edit-btn {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
