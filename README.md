# eStore — منصة التجارة الإلكترونية الفاخرة | estore.eshamikh.com

منصة التجارة الإلكترونية والمتجر الرقمي الفاخر التابع لـ **eShamikh Studio**. مبنية بالكامل بنظام التصميم الأبيض الفاخر النقي (**Pure Luxury White Aesthetic** - بدون أي لون أزرق)، ومجهزة بأرقى معايير تجربة المستخدم ومؤشرات الأداء المالي، مع دعم سداد فواتير المتاجر عبر بطاقات كي كارد العراقية.

---

## 🌟 المكونات الأساسية للمنصة (eStore Core)

1. **eStore Luxury Shop (متجر الزبائن الفاخر — `/`)**:
   - واجهة متجر مستوحاة من Apple و Vercel Commerce.
   - بنر استعراضي تحريري وشبكة منتجات عصرية مع بادجات أسعار كبسولية عائمة بالدينار العراقي (`د.ع`).
   - معاينة سريعة للمنتجات (Quick-View Modal) ودرج سلة تسوق منزلق (Slide-over Cart Drawer) مع حسابات المجموع وإتمام الطلب المباشر.

2. **eStore Dashboard (لوحة تحكم التاجر — `/estore/dashboard`)**:
   - مؤشرات الأداء المالي (KPIs) للإيرادات والطلبات ومعدل التحويل ومتوسط قيمة السلة (AOV).
   - جدول الطلبات الحية مع فلاتر الحالات والبحث الفوري وتحديث الحالات.
   - نافذة تسوية فواتير المتجر الشهرية الثابتة (25,000 د.ع) عبر بطاقات كي كارد العراقية مع فحص التوقيع الرقمي.

3. **eIdentity & Account Management (إدارة حساب التاجر — `/account`)**:
   - إدارة ملف التاجر، اسم المتجر، رقم الهاتف العراقي المعتمد، والأفاتار عبر Supabase Storage.
   - تحديث كلمة المرور، إدارة الجلسات والأجهزة النشطة، وتصدير كامل لبيانات الحساب بتنسيق JSON.

4. **eSecurity (درع الحماية والتوقيع الرقمي)**:
   - توقيع رقمي مشفر HMAC-SHA256 لمنع التلاعب بالطلبات والعمليات الحساسة.
   - حماية ضد هجمات Replay مع فحص الانحراف الزمني وسجل تدقيق أمني تلقائي مرتبط بـ Supabase.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

- **Framework**: Next.js 16 (App Router & Turbopack)
- **Language**: TypeScript & React 19
- **Database & Auth**: Supabase PostgreSQL & Supabase Auth
- **Styling**: Pure Vanilla CSS Luxury Design System (Pure White Theme, NO Blue, IBM Plex Sans Arabic)
- **Icons**: Lucide React
- **QR Engine**: qrcode (Vector & HD Raster)

---

## 🚀 التشغيل المحلي (Getting Started)

1. **تثبيت الحزم**:
   ```bash
   npm install
   ```

2. **إعداد المتغيرات البيئية**:
   انسخ ملف `.env.example` إلى `.env.local` وأضف مفاتيح مشروع Supabase الخاص بك:
   ```bash
   cp .env.example .env.local
   ```

3. **بدء خادم التطوير**:
   ```bash
   npm run dev
   ```
   افتح [http://localhost:3000](http://localhost:3000) في متصفحك.

---

## 📄 الترخيص (License)

جميع الحقوق محفوظة لـ **eShamikh Studio 2026**.
