# نظام ولغة التصميم الأبيض الفاخر (Clean Luxury White Design System)
## منظومة eShamikh Cloud & Services Ecosystem

---

## 1. الفلسفة الجمالية والتجربة البصرية (Aesthetic Philosophy)
تعتمد المنظومة على **المينيماليزم الفاخر (High-End Minimalist White)**:
- مساحات بيضاء متجددة الهواء تمنح المستخدم شعوراً بالاتساع والنقاء والاحترافية المؤسسية.
- تجنب الألوان الصارخة أو الخلفيات المزدحمة؛ الاعتماد على التباين المدروس بين الأبيض العاجي والأسود الكربوني مع لمسات ذهبية دقيقة.
- عناصر تفاعلية دقيقة (Micro-interactions) وظلال ناعمة خفيفة (Micro-shadows) تكاد لا تُرى لكنها تمنح عمقاً ثلاثي الأبعاد راقياً.

---

## 2. لوحة الألوان المعتمدة (Color Palette)

| اسم اللون | الرمز اللوني | الاستخدام في الواجهات |
| :--- | :---: | :--- |
| **الخلفية الكبرى (Canvas/Page)** | `#FAFAFA` | لون خلفية الموقع والصفحات الأساسية لإراحة العين |
| **أسطح البطاقات (Card Surface)** | `#FFFFFF` | البطاقات، القوائم المنبثقة، والجداول |
| **النصوص الرئيسية (Foreground)** | `#09090B` | العناوين الكبرى، نصوص القراءة الأساسية (أسود كربوني) |
| **النصوص الثانوية (Muted Text)** | `#71717A` | التسميات التوضيحية، الإحصائيات المساعدة |
| **الحدود الدقيقة (Micro-Border)** | `#E4E4E7` | حدود البطاقات والحاويات `1px solid #E4E4E7` |
| **الزر الرئيسي والتباين (Primary)** | `#18181B` | أزرار الإجراء الرئيسي (CTA)، القوائم البارزة |
| **اللمسة الذهبية (Brand Accent)** | `#C5A059` / `#D4AF37` | تفاصيل الشعار، خطوط التمييز، والوسوم الفاخرة |
| **حالة النجاح (Success/Delivered)**| `#059669` | وسوم اكتمال الطلب وسداد الفاتورة |
| **حالة التنبيه (Warning/Lock 1)** | `#D97706` | تنبيهات قرب انتهاء فترة السماح |
| **حالة الخطر (Danger/Suspended)** | `#DC2626` | حالات الحظر والتعليق ومخالفات الأمان |

---

## 3. الخطوط والطباعة المعيارية (Typography)

- **الخط العربي والإنجليزي الرسمي:** **`IBM Plex Sans Arabic`**
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  ```
- **سلم الأحجام:**
  - `Hero Heading (H1):` 36px - 44px (Bold / 700)
  - `Section Heading (H2):` 24px - 30px (SemiBold / 600)
  - `Card Title (H3):` 18px - 20px (Medium / 500)
  - `Body Text:` 15px - 16px (Regular / 400)
  - `Caption & Badges:` 12px - 13px (Medium / 500)

---

## 4. الظلال والزجاج الشفاف (Shadows & Glassmorphism)

- **الظل المجهري للبطاقات (Micro-Shadow):**
  ```css
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02), 0 4px 12px 0 rgba(0, 0, 0, 0.03);
  ```
- **ظل التحويم (Card Hover Shadow):**
  ```css
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
  ```
- **شريط التنقل الزجاجي (Frosted Glass Navbar):**
  ```css
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(228, 228, 231, 0.6);
  ```

---

## 5. مصفوفة المكونات الموحدة (UI Component Matrix)

### أ. الأزرار (Buttons)
1. **الزر الأساسي (Primary Button):** خلفية `#09090B`، نص أبيض `#FFFFFF`، حواف مستديرة `8px`، وانتقال تدريجي ناعم عند التمرير.
2. **الزر الثانوي (Secondary Button):** خلفية `#FFFFFF`، حدود `1px solid #E4E4E7`، نص `#09090B`.
3. **زر الإجراء الحرج (Danger Button):** خلفية ناعمة `#FEF2F2`، حدود `#FCA5A5`، نص `#DC2626`.

### ب. حقول الإدخال (Inputs)
- خلفية بيضاء `#FFFFFF`، حدود `1px solid #E4E4E7`، نصف قطر انحناء `8px`، تركيز بنعومة (Ring focus) بلون `#18181B`.

### ج. الجداول (Data Tables)
- رأس الجدول بخلفية `#F4F4F5` خفيفة ونصوص صغيرة شبه عريضة.
- صفوف الجدول تتخللها خطوط تقسيم دقيقة بلون `#F1F1F4` مع تأثير تظليل خفيف عند مرور المؤشر.
