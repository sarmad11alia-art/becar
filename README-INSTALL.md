# موقع بي كير (Bcare) — حزمة التثبيت الكاملة

هذه الحزمة تحتوي كل ما يلزم لإعادة نشر الموقع في أي وقت.

## المحتويات

| المسار | الوصف |
|---|---|
| `src/` | كود الموقع (React + TanStack Start) |
| `public/` | ملفات ثابتة (favicon، robots) |
| `images/` | **جميع صور الموقع الحقيقية** (شعارات شركات التأمين والبنوك ونفاذ وبي كير…) |
| `database/schema.sql` | بنية قاعدة البيانات (جداول، صلاحيات، سياسات RLS، Realtime) |
| `database/seed_data.sql` | بيانات الإعدادات الأولية |
| `database/insurance_offers_current.sql` | 118 عرض تأمين كما هي الآن في قاعدة البيانات |
| `drizzle/`, `supabase/` | ملفات الهجرات والإعدادات |
| `package.json`, `bunfig.toml`, `vite.config.ts` | ملفات البناء |

> ملاحظة أمنية: بيانات العملاء والبطاقات وسجلات الزيارات **غير مشمولة** عمدًا.

## المتطلبات
- Node.js 20+ أو Bun
- مشروع Supabase (أو Lovable Cloud)

## خطوات التثبيت

### 1. تثبيت الحزم
```bash
cd bcare
bun install    # أو npm install
```

### 2. متغيرات البيئة
أنشئ ملف `.env` في الجذر:
```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
VITE_SUPABASE_PROJECT_ID=<project-id>
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### 3. تهيئة قاعدة البيانات
```bash
psql "<DATABASE_URL>" -f database/schema.sql
psql "<DATABASE_URL>" -f database/seed_data.sql
psql "<DATABASE_URL>" -f database/insurance_offers_current.sql
```

### 4. رفع الصور
صور الموقع في مجلد `images/`. ارفعها إلى مزوّد الصور الذي تستخدمه (R2، S3،
Supabase Storage…) ثم حدّث روابطها في ملفات `src/assets/**.asset.json` (كل
ملف يحتوي حقل `url`).

إن كنت تنشر على Lovable فستُرفع تلقائيًا من مجلد `src/assets/` دون أي عمل يدوي.

### 5. حساب المدير
أنشئ حسابًا من `/auth`، ثم من قاعدة البيانات:
```sql
insert into public.user_roles (user_id, role)
values ('<user-uuid>', 'admin');
```

### 6. التشغيل محليًا
```bash
bun run dev          # http://localhost:8080
```

### 7. البناء للإنتاج
```bash
bun run build
```

## المزايا
- صفحات تأمين (شامل / ضد الغير / طبي / سفر) بأسعار قائمة على قيمة المركبة.
- خصم بي كير 10%، وخصم إضافي 30% عند الدفع بالبطاقة.
- مسح البطاقة بالكاميرا تلقائيًا (OCR عبر tesseract.js).
- التعرف على البنوك السعودية من أرقام BIN.
- لوحة تحكم لحظية لإدارة الزوار والطلبات والحظر.
- التحديث اللحظي (Realtime) في جميع صفحات الزائر.
