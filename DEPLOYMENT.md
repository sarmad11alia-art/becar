# دليل نشر موقع بي كير (Bcare)

هذا الأرشيف يحتوي على كود الموقع كاملًا مع الصور وملفات قاعدة البيانات.

## محتويات الأرشيف

| المسار | الوصف |
|---|---|
| `src/` | كود الموقع (React + TanStack Start) |
| `src/assets/` | الصور والشعارات وملفات الوسائط |
| `database/schema.sql` | بنية قاعدة البيانات (الجداول والصلاحيات والسياسات) |
| `database/seed_data.sql` | بيانات العروض والإعدادات (بدون أي بيانات عملاء أو بطاقات) |
| `package.json` | الحزم المطلوبة |

> ملاحظة أمنية: بيانات العملاء والبطاقات وسجلات الزيارات **غير مشمولة** في هذا الأرشيف عمدًا.

## المتطلبات

- Node.js 20+ أو Bun
- مشروع Supabase (أو Lovable Cloud)

## خطوات النشر

### 1. فك الضغط وتثبيت الحزم

```bash
unzip bcare-site.zip
cd bcare
bun install   # أو npm install
```

### 2. إعداد قاعدة البيانات

أنشئ مشروع Supabase جديدًا ثم نفّذ ملفي SQL بالترتيب:

```bash
psql "<رابط قاعدة البيانات>" -f database/schema.sql
psql "<رابط قاعدة البيانات>" -f database/seed_data.sql
```

أو من لوحة Supabase: SQL Editor ← الصق محتوى `schema.sql` ثم `seed_data.sql`.

### 3. متغيرات البيئة

أنشئ ملف `.env` في الجذر:

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
VITE_SUPABASE_PROJECT_ID=<project-id>
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
ADMIN_INITIAL_PASSWORD=<كلمة مرور قوية للمدير>
```

### 4. إنشاء حساب المدير

من لوحة Supabase ← Authentication ← Add User، أنشئ مستخدمًا بالبريد المطلوب، ثم نفّذ:

```sql
insert into public.profiles (id, display_name) values ('<user-uuid>', 'ماجد');
insert into public.user_roles (user_id, role) values ('<user-uuid>', 'admin');
```

### 5. التشغيل محليًا

```bash
bun run dev
```

الموقع على `http://localhost:8080` ولوحة التحكم على `/dashboard` (تتطلب تسجيل الدخول من `/auth`).

### 6. البناء للإنتاج

```bash
bun run build
```

## أبرز المزايا

- عروض تأمين (شامل / ضد الغير) بأسعار تعتمد على قيمة المركبة مع خصم بي كير 10%.
- خصم 30% عند اختيار الدفع بالبطاقة الائتمانية.
- مسح بطاقة البنك بالكاميرا مباشرة (قراءة تلقائية للاسم والرقم وتاريخ الانتهاء).
- التعرف على البنوك السعودية من أرقام BIN.
- لوحة تحكم لحظية (Realtime) لإدارة الزوار والطلبات والحظر.
- حفظ لحظي للمدخلات أثناء تصفح الزائر.
