# eServices — eShamikh Cloud Ecosystem | بوابة الخدمات السحابية

منظومة الخدمات المركزية ومركز المصادقة الموحد (SSO) التابع لـ **eShamikh Studio**. مبنية بالكامل بنظام التصميم الأبيض الفاخر النقي (**Pure Luxury White Aesthetic**) ومجهزة بأحدث معايير الأمان والتجارة والذكاء الاصطناعي.

---

## 🌟 الخدمات المتكاملة في المنظومة (Ecosystem Services)

1. **eLink (محرك الروابط الذكية واستوديو QR)**:
   - توليد روابط مختصرة ديناميكية مع استوديو رموز الاستجابة السريعة (Vector SVG & HD PNG).
   - حماية الروابط بكلمة سر، وشاشة التصفح الآمن (Safe Browsing Interstitial).
   - زر الإيقاف الفوري (Kill Switch) وتحديد سقف النقرات وتاريخ الصلاحية.
   - تحليلات نقرات لحظية مشفرة تحترم الخصوصية طبقاً لـ GDPR.

2. **eStore Dashboard (لوحة تحكم التجارة الإلكترونية)**:
   - مؤشرات الأداء المالي (KPIs) للإيرادات والطلبات ومعدل التحويل ومتوسط قيمة السلة (AOV).
   - جدول الطلبات الحية مع فلاتر الحالات والبحث الفوري.
   - نافذة تسوية فواتير المتجر الشهرية الثابتة (25,000 د.ع) عبر بطاقات كي كارد العراقية.

3. **eStore Luxury Shop (متجر الزبائن الفاخر)**:
   - واجهة متجر مستوحاة من Apple و Vercel Commerce.
   - بنر استعراضي تحريري وشبكة منتجات عصرية مع بادجات أسعار كبسولية عائمة.
   - معاينة سريعة للمنتجات (Quick-View Modal) ودرج سلة تسوق منزلق (Slide-over Cart Drawer) مع حسابات المجموع وإتمام الطلب.

4. **eSecurity (درع الحماية والتوقيع الرقمي)**:
   - توقيع رقمي مشفر HMAC-SHA256 لمنع التلاعب بالطلبات.
   - حماية ضد هجمات Replay مع فحص الانحراف الزمني.
   - سجل تدقيق أمني تلقائي مرتبط بقواعد بيانات Supabase.

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
