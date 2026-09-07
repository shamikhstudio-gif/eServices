# عقود ومواصفات واجهات البرمجة (API Contracts & Specifications)
## منظومة eShamikh Cloud & Services Ecosystem

---

## 1. المعايير العامة للـ APIs (Global API Standards)
- **بروتوكول الاتصال:** HTTPS حصراً مع دعم HTTP/2 و HTTP/3.
- **تنسيق تبادل البيانات:** JSON (`Content-Type: application/json; charset=utf-8`).
- **ترويسات الأمان الإلزامية لجميع طلبات التعديل (`POST`, `PUT`, `PATCH`, `DELETE`):**
  - `X-Signature`: توقيع HMAC-SHA256 للسلسلة المعيارية للطلب.
  - `X-Timestamp`: ختم زمني UTC بالميلي ثانية (بحد أقصى انحراف 60 ثانية).
- **كود الخطأ الأمني الموحد:**
  ```json
  {
    "error": "REQUEST_INTEGRITY_COMPROMISED",
    "code": 4031
  }
  ```

---

## 2. مركز المصادقة وإدارة الهوية الموحد (Supabase Auth & SSO)

تعتمد المنظومة رسمياً على **محرك Supabase Auth الأصلي** لإدارة الحسابات، الجلسات، واستخراج التوكنات، مع ضبط كوكيز النطاق المشترك `.eshamikh.com`:

### أ. تهيئة عميل سوبابيس المشترك (Supabase Client Configuration)
```typescript
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookieOptions: {
      domain: '.eshamikh.com', // نطاق موحد لكافة المنظومة
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  }
);
```

### ب. عقود عمليات المصادقة الأساسية (Native Auth Methods)
1. **تسجيل حساب تاجر جديد:**
   ```typescript
   const { data, error } = await supabase.auth.signUp({
     email: 'merchant@store.com',
     password: 'SecurePassword123!',
     options: {
       data: {
         full_name: 'علي الشامخ',
         phone_number: '+9647701234567',
         role: 'merchant',
       },
     },
   });
   ```
2. **تسجيل الدخول المركزي (Sign In):**
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'merchant@store.com',
     password: 'SecurePassword123!',
   });
   ```
3. **التحقق من الجلسة الموحدة وقراءة البروفايل (Session & Profile):**
   ```typescript
   // التحقق من المستخدم الموثق عبر السيرفر أو العميل
   const { data: { user } } = await supabase.auth.getUser();

   // جلب بيانات الحساب المحدثة مع صلاحيات RLS
   const { data: profile } = await supabase
     .from('profiles')
     .select('*')
     .eq('id', user.id)
     .single();
   ```
4. **تحديث بيانات الملف الشخصي (Profile Update):**
   - يتم مباشرة عبر استعلام Supabase الآمن مع تطبيق سياسات الـ RLS وترويسات توقيع الـ HMAC عند استخدام وسيط التعديل:
   ```typescript
   const { error } = await supabase
     .from('profiles')
     .update({ full_name: 'علي الشامخ', phone_number: '+9647701234567' })
     .eq('id', user.id);
   ```

---

## 3. محرك التتبع الذكي (`/api/etrack/*`)

### أ. إنشاء شحنة جديدة (Create Shipment)
- **المسار:** `POST /api/etrack/shipments`
- **التوقيع الأمني:** إلزامي.
- **حمولة الطلب:**
```json
{
  "order_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "origin_city": "بغداد",
  "destination_city": "البصرة",
  "customer_phone": "07701234567",
  "notes": "يرجى التسليم عصراً"
}
```
- **الاستجابة الناجحة (`201 Created`):**
```json
{
  "tracking_number": "SHM-IRQ-892134",
  "status": "REGISTERED",
  "estimated_delivery": "2026-09-08T18:00:00Z"
}
```

### ب. الاستعلام العام عن الشحنة (Public Track Query)
- **المسار:** `GET /api/etrack/track/:tracking_number`
- **الوصول:** عام ومفتوح دون توقيع للمشترين.
- **الاستجابة الناجحة (`200 OK`):**
```json
{
  "tracking_number": "SHM-IRQ-892134",
  "current_status": "OUT_FOR_DELIVERY",
  "history": [
    { "status": "REGISTERED", "location": "مركز فرز بغداد", "timestamp": "2026-09-06T09:00:00Z" },
    { "status": "IN_TRANSIT", "location": "طريق بغداد - البصرة السريع", "timestamp": "2026-09-06T15:30:00Z" },
    { "status": "OUT_FOR_DELIVERY", "location": "فرع البصرة العشار", "timestamp": "2026-09-06T18:00:00Z" }
  ]
}
```

---

## 4. نظام المتاجر والفوترة (`/api/estore/*`)

### أ. تحديث حالة الطلب وتطبيق العمولة (Order Status Update)
- **المسار:** `PATCH /api/estore/orders/:order_id/status`
- **التوقيع الأمني:** إلزامي.
- **حمولة الطلب:**
```json
{
  "status": "DELIVERED"
}
```
- **السلوك البرمجي في الخادم:** عند استقبال `DELIVERED`، يتم تحديث حالة الطلب وتسجيل إتمام عملية البيع وربطها مع إحصائيات المتجر الشهرية.

### ب. تسوية الفاتورة الشهرية عبر كي كارد (Qi Card Settlement Submission)
- **المسار:** `POST /api/estore/invoices/:invoice_id/settle-qi`
- **التوقيع الأمني:** إلزامي.
- **حمولة الطلب:**
```json
{
  "qi_transaction_ref": "QI-202609-88127394",
  "receipt_url": "https://services.eshamikh.com/storage/receipts/rec_8812.jpg",
  "notes": "تم التحويل من حساب كرت رقم 5214"
}
```
- **الاستجابة الناجحة (`200 OK`):**
```json
{
  "status": "UNDER_REVIEW",
  "temporary_unlock": true,
  "message": "تم استلام إشعار التحويل بنجاح، وجاري التحقق من السداد وتفعيل المتجر."
}
```
