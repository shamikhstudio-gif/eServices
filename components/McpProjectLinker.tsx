'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Plus, Copy, Check, Trash2, Globe, Key, Activity,
  ChevronDown, ChevronUp, Code2, Loader2,
  Terminal, Zap, AlertCircle, Eye, EyeOff, PlugZap,
  Shield, ShieldAlert, ShieldCheck, Lock, Unlock,
  SlidersHorizontal, Radio
} from 'lucide-react';

interface McpProject {
  id: string;
  name: string;
  description: string | null;
  project_url: string | null;
  api_key: string;
  api_secret: string;
  allow_high_privilege: boolean;
  is_active: boolean;
  created_at: string;
  user_id: string;
}

interface McpProjectLinkerProps {
  userId: string;
  userEmail?: string | null;
}

function generateSetupPrompt(project: McpProject, userEmail?: string | null): string {
  const mcpUrl = `https://services.eshamikh.com/api/mcp`;
  
  return `# دليل ربط وإدارة مشروع "${project.name}" عبر eShamikh MCP & Admin API

## ما هو eShamikh MCP؟
بروتوكول متقدم (Model Context Protocol) يتيح لأدوات الذكاء الاصطناعي (مثل Cursor وWindsurf وClaude Desktop) وللمطورين بناء لوحات تحكم مخصصة (Custom Dashboards) والتفاعل البرمجي المباشر مع خدمات منصة eShamikh كـ eLink دون الحاجة لفتح الواجهة يدوياً.

---

## بيانات الاتصال والمصادقة لمشروعك
\`\`\`
اسم المشروع          : ${project.name}
معرّف المشروع         : ${project.id}
رابط نقطة الاتصال     : ${mcpUrl}
مفتاح API العام      : ${project.api_key}
المفتاح السري Secret  : ${project.api_secret}
الصلاحيات المتقدمة    : ${project.allow_high_privilege ? 'مُفعّلة (تعديل وحذف مسموح)' : 'معطّلة (قراءة وإنشاء فقط)'}
حالة المشروع         : ${project.is_active ? 'نشط' : 'معطّل'}
\`\`\`

---

## 1. الإعداد في أدوات الذكاء الاصطناعي (Cursor / Windsurf / Claude)

### في Cursor IDE:
افتح ملف \`~/.cursor/mcp.json\` وأضف الإعداد التالي:
\`\`\`json
{
  "mcpServers": {
    "eshamikh": {
      "url": "${mcpUrl}",
      "headers": {
        "Authorization": "Bearer ${project.api_key}",
        "X-Project-ID": "${project.id}"
      }
    }
  }
}
\`\`\`

### في Claude Desktop:
افتح \`claude_desktop_config.json\` وأضف:
\`\`\`json
{
  "mcpServers": {
    "eshamikh": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch", "${mcpUrl}"],
      "env": {
        "MCP_API_KEY": "${project.api_key}",
        "MCP_PROJECT_ID": "${project.id}"
      }
    }
  }
}
\`\`\`

---

## 2. بناء لوحة تحكم مخصصة على الشبكة (Custom Admin Dashboard)
إذا كنت تبني لوحة تحكم خاصة بك وتريد نشرها على الشبكة:
- احتفظ بالمفتاح السري \`api_secret\` داخل متغيرات البيئة في الخادم (\`process.env.ESHAMIKH_API_SECRET\`).
- لا تنشر المفتاح السري في كود الواجهة الأمامية (Frontend).
- يمكنك إرسال استدعاءات REST مباشرة إلى \`${mcpUrl}\`:

\`\`\`bash
# 1. إنشاء رابط جديد:
curl -X POST "${mcpUrl}" \\
  -H "Authorization: Bearer ${project.api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{"action": "create", "destination_url": "https://google.com", "custom_slug": "my-slug"}'

# 2. تعديل رابط قائم (يتطلب تفعيل الصلاحيات المتقدمة):
curl -X POST "${mcpUrl}" \\
  -H "Authorization: Bearer ${project.api_secret}" \\
  -H "Content-Type: application/json" \\
  -d '{"action": "update", "slug": "my-slug", "destination_url": "https://eshamikh.com"}'

# 3. حذف رابط نهائياً (يتطلب تفعيل الصلاحيات المتقدمة):
curl -X POST "${mcpUrl}" \\
  -H "Authorization: Bearer ${project.api_secret}" \\
  -H "Content-Type: application/json" \\
  -d '{"action": "delete", "slug": "my-slug"}'
\`\`\`

---

## 3. جدول الأوامر والصلاحيات المتاحة

| اسم الأداة | نوع الصلاحية | الوظيفة |
|------------|-------------|---------|
| \`elink_create\` | عادية (Standard) | إنشاء رابط مختصر جديد |
| \`elink_list\` | عادية (Standard) | استعراض روابط حسابك الحالية |
| \`elink_stats\` | عادية (Standard) | فحص إحصائيات النقرات وتفاصيل الرابط |
| \`elink_update\` | ⚡ متقدمة (High) | تعديل الرابط الهدف أو العنوان أو حالة التفعيل |
| \`elink_delete\` | ⚡ متقدمة (High) | الحذف النهائي للرابط وسجل إحصائياته |

> **ملاحظة أمنية**: الأوامر المتقدمة (الحذف والتعديل) ترفض أي عملية وتُرجع خطأ \`403\` ما لم تكن الصلاحيات المتقدمة مفعلة في المشروع أو يتم استخدام المفتاح السري (Secret Key).

---
*تم توليد هذا الدليل تلقائياً بواسطة منصة eShamikh Cloud Portal*
*معرّف المشروع: ${project.id} | التاريخ: ${new Date().toLocaleDateString('ar-IQ')}*`;
}

export default function McpProjectLinker({ userId, userEmail }: McpProjectLinkerProps) {
  const supabase = createClient();
  const [projects, setProjects] = useState<McpProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [updatingPrivilegeId, setUpdatingPrivilegeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newAllowHigh, setNewAllowHigh] = useState(false);

  async function loadProjects() {
    const { data, error } = await supabase
      .from('mcp_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) setProjects(data);
    setLoading(false);
  }

  useEffect(() => {
    loadProjects();
  }, [userId]);

  async function handleCreate() {
    if (!newName.trim()) {
      setError('يُرجى إدخال اسم المشروع');
      return;
    }
    setCreating(true);
    setError(null);

    const { data, error } = await supabase
      .from('mcp_projects')
      .insert({
        user_id: userId,
        name: newName.trim(),
        description: newDesc.trim() || null,
        project_url: newUrl.trim() || null,
        allow_high_privilege: newAllowHigh,
      })
      .select()
      .single();

    if (error) {
      setError('فشل إنشاء المشروع. يُرجى المحاولة مرة أخرى.');
    } else if (data) {
      setProjects(prev => [data, ...prev]);
      setNewName('');
      setNewDesc('');
      setNewUrl('');
      setNewAllowHigh(false);
      setShowCreate(false);
      setExpandedId(data.id);
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from('mcp_projects')
      .delete()
      .eq('id', id);

    if (!error) {
      setProjects(prev => prev.filter(p => p.id !== id));
    } else {
      setError('فشل حذف المشروع. يُرجى المحاولة مرة أخرى.');
    }
  }

  async function handleToggle(id: string, current: boolean) {
    const { error } = await supabase
      .from('mcp_projects')
      .update({ is_active: !current })
      .eq('id', id);

    if (!error) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
    }
  }

  async function handleToggleHighPrivilege(id: string, current: boolean) {
    setUpdatingPrivilegeId(id);
    const nextVal = !current;
    const { error } = await supabase
      .from('mcp_projects')
      .update({ allow_high_privilege: nextVal })
      .eq('id', id);

    if (!error) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, allow_high_privilege: nextVal } : p));
    } else {
      setError('فشل تعديل الصلاحيات المتقدمة. يُرجى المحاولة مرة أخرى.');
    }
    setUpdatingPrivilegeId(null);
  }

  async function copyText(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function toggleKeyVisibility(id: string) {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSecretVisibility(id: string) {
    setVisibleSecrets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function maskKey(key: string, prefixLen = 8): string {
    if (!key) return '';
    return key.slice(0, prefixLen) + '••••••••••••••••' + key.slice(-4);
  }

  if (loading) {
    return (
      <div className="mcp-loading">
        <Loader2 size={20} className="spin" />
        <span>جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="mcp-linker">
      {/* Header */}
      <div className="mcp-header">
        <div className="mcp-header-left">
          <div className="mcp-icon-badge">
            <PlugZap size={16} />
          </div>
          <div>
            <h3 className="mcp-title">eShamikh MCP & Admin API</h3>
            <p className="mcp-subtitle">اربط مشاريعك بالذكاء الاصطناعي وابنِ لوحات تحكمك الخاصة بأمان</p>
          </div>
        </div>
        <button
          className={`mcp-create-btn ${showCreate ? 'active' : ''}`}
          onClick={() => setShowCreate(!showCreate)}
        >
          <Plus size={15} />
          مشروع جديد
        </button>
      </div>

      {/* Info Notice */}
      <div className="mcp-info-banner">
        <div className="mcp-info-icon">
          <Radio size={14} />
        </div>
        <div className="mcp-info-text">
          <strong>هل تود بناء لوحة تحكم مخصصة (Custom Dashboard)؟</strong>
          <span>يمكنك استخدام الـ API والمفتاح السري (Secret Key) لتشغيل لوحتك الخارجية على أي شبكة مع صلاحيات الحذف والتعديل الكاملة.</span>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="mcp-create-form">
          <div className="mcp-form-grid">
            <div className="mcp-field">
              <label>اسم المشروع *</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="مثال: لوحة التحكم الخارجية / متجري"
                className="mcp-input"
                dir="rtl"
              />
            </div>
            <div className="mcp-field">
              <label>رابط المشروع</label>
              <input
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://my-dashboard.com"
                className="mcp-input"
              />
            </div>
            <div className="mcp-field mcp-field-full">
              <label>وصف مختصر</label>
              <input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="وصف اختياري لغرض المشروع واللوحة..."
                className="mcp-input"
                dir="rtl"
              />
            </div>

            {/* High Privilege Toggle on Create */}
            <div className="mcp-field mcp-field-full">
              <div
                className={`mcp-privilege-box ${newAllowHigh ? 'active' : ''}`}
                onClick={() => setNewAllowHigh(!newAllowHigh)}
              >
                <div className="mcp-privilege-left">
                  {newAllowHigh ? <ShieldAlert size={18} className="text-warn" /> : <Shield size={18} />}
                  <div>
                    <div className="mcp-privilege-title">
                      تمكين الأوامر المتقدمة (تعديل وحذف الروابط)
                    </div>
                    <div className="mcp-privilege-desc">
                      اسمح للمشروع بالوصول لأدوات الحذف (elink_delete) والتعديل (elink_update). مناسب لبناء لوحات التحكم المخصصة.
                    </div>
                  </div>
                </div>
                <div className={`mcp-switch ${newAllowHigh ? 'on' : 'off'}`}>
                  <div className="mcp-switch-knob" />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mcp-error">
              <AlertCircle size={13} />
              {error}
            </div>
          )}

          <div className="mcp-form-actions">
            <button className="mcp-cancel-btn" onClick={() => setShowCreate(false)}>
              إلغاء
            </button>
            <button className="mcp-submit-btn" onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 size={14} className="spin" /> : <Zap size={14} />}
              {creating ? 'جاري الإنشاء...' : 'إنشاء وتوليد المفاتيح'}
            </button>
          </div>
        </div>
      )}

      {/* Project List */}
      {projects.length === 0 && !showCreate ? (
        <div className="mcp-empty">
          <Terminal size={32} />
          <p>لا توجد مشاريع مرتبطة بعد</p>
          <span>أنشئ أول مشروع وابدأ بالتكامل مع أدوات الذكاء الاصطناعي أو لوحات التحكم الخارجية</span>
        </div>
      ) : (
        <div className="mcp-project-list">
          {projects.map(project => {
            const isExpanded = expandedId === project.id;
            const isKeyVisible = visibleKeys.has(project.id);
            const isSecretVisible = visibleSecrets.has(project.id);
            const prompt = generateSetupPrompt(project, userEmail);

            return (
              <div key={project.id} className={`mcp-project-card ${!project.is_active ? 'inactive' : ''}`}>
                {/* Card Header */}
                <div
                  className="mcp-project-header"
                  onClick={() => setExpandedId(isExpanded ? null : project.id)}
                >
                  <div className="mcp-project-left">
                    <div className={`mcp-status-dot ${project.is_active ? 'active' : 'inactive'}`} />
                    <div>
                      <div className="mcp-project-name">{project.name}</div>
                      {project.project_url && (
                        <div className="mcp-project-url">
                          <Globe size={10} />
                          {project.project_url}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mcp-project-right">
                    {project.allow_high_privilege ? (
                      <span className="mcp-badge privilege-high" title="الصلاحيات المتقدمة مفعلة: الحذف والتعديل مسموح">
                        <ShieldAlert size={10} />
                        أوامر متقدمة (حذف/تعديل)
                      </span>
                    ) : (
                      <span className="mcp-badge privilege-std" title="صلاحيات أساسية فقط: قراءة وإنشاء">
                        <Lock size={10} />
                        صلاحيات أساسية
                      </span>
                    )}

                    <span className={`mcp-badge ${project.is_active ? 'active' : 'inactive'}`}>
                      {project.is_active ? 'نشط' : 'معطّل'}
                    </span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mcp-project-details">
                    {project.description && (
                      <p className="mcp-desc">{project.description}</p>
                    )}

                    {/* API Key (Public / AI tools) */}
                    <div className="mcp-key-row">
                      <div className="mcp-key-label">
                        <Key size={12} />
                        مفتاح API
                        <span className="mcp-key-hint">(لـ Cursor / AI)</span>
                      </div>
                      <div className="mcp-key-value">
                        <code>{isKeyVisible ? project.api_key : maskKey(project.api_key)}</code>
                        <button
                          className="mcp-icon-btn"
                          onClick={() => toggleKeyVisibility(project.id)}
                          title={isKeyVisible ? 'إخفاء' : 'إظهار'}
                        >
                          {isKeyVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button
                          className="mcp-icon-btn"
                          onClick={() => copyText(project.api_key, `key-${project.id}`)}
                          title="نسخ المفتاح"
                        >
                          {copiedId === `key-${project.id}` ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* Secret Key (Admin / Backend Dashboards) */}
                    <div className="mcp-key-row mcp-secret-row">
                      <div className="mcp-key-label">
                        <Lock size={12} />
                        مفتاح Secret
                        <span className="mcp-key-hint">(للخوادم ولوحات التحكم)</span>
                      </div>
                      <div className="mcp-key-value">
                        <code>{isSecretVisible ? project.api_secret : maskKey(project.api_secret, 4)}</code>
                        <button
                          className="mcp-icon-btn"
                          onClick={() => toggleSecretVisibility(project.id)}
                          title={isSecretVisible ? 'إخفاء' : 'إظهار'}
                        >
                          {isSecretVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button
                          className="mcp-icon-btn"
                          onClick={() => copyText(project.api_secret, `sec-${project.id}`)}
                          title="نسخ المفتاح السري"
                        >
                          {copiedId === `sec-${project.id}` ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* MCP URL */}
                    <div className="mcp-key-row">
                      <div className="mcp-key-label">
                        <Globe size={12} />
                        نقطة الاتصال (Endpoint)
                      </div>
                      <div className="mcp-key-value">
                        <code>https://services.eshamikh.com/api/mcp</code>
                        <button
                          className="mcp-icon-btn"
                          onClick={() => copyText('https://services.eshamikh.com/api/mcp', `url-${project.id}`)}
                        >
                          {copiedId === `url-${project.id}` ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* Quick High Privilege Toggle in Card */}
                    <div className="mcp-privilege-setting-row">
                      <div className="mcp-privilege-info">
                        <SlidersHorizontal size={14} />
                        <div>
                          <strong>الصلاحيات المتقدمة (High Commands):</strong>
                          <span>السماح بحذف وتعديل الروابط عبر الـ API والـ MCP</span>
                        </div>
                      </div>
                      <button
                        className={`mcp-privilege-toggle-btn ${project.allow_high_privilege ? 'enabled' : 'disabled'}`}
                        onClick={() => handleToggleHighPrivilege(project.id, project.allow_high_privilege)}
                        disabled={updatingPrivilegeId === project.id}
                      >
                        {updatingPrivilegeId === project.id ? (
                          <Loader2 size={12} className="spin" />
                        ) : project.allow_high_privilege ? (
                          <Unlock size={12} />
                        ) : (
                          <Lock size={12} />
                        )}
                        {project.allow_high_privilege ? 'مُفعّلة (تعديل/حذف)' : 'معطّلة (مقيدة)'}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="mcp-actions">
                      <button
                        className="mcp-copy-prompt-btn"
                        onClick={() => copyText(prompt, `prompt-${project.id}`)}
                      >
                        {copiedId === `prompt-${project.id}` ? (
                          <>
                            <Check size={14} />
                            تم نسخ الدليل الكامل!
                          </>
                        ) : (
                          <>
                            <Code2 size={14} />
                            نسخ دليل الإعداد ولوحات التحكم
                          </>
                        )}
                      </button>

                      <div className="mcp-secondary-actions">
                        <button
                          className="mcp-toggle-btn"
                          onClick={() => handleToggle(project.id, project.is_active)}
                        >
                          <Activity size={12} />
                          {project.is_active ? 'تعطيل' : 'تفعيل'}
                        </button>
                        <button
                          className="mcp-delete-btn"
                          onClick={() => handleDelete(project.id)}
                        >
                          <Trash2 size={12} />
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
