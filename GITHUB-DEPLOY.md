# دليل نشر موقع بي كير (Bcare) عبر GitHub

هذا الموقع تطبيق كامل (واجهة + خادم + قاعدة بيانات) مبني على TanStack Start، لذلك يحتاج استضافة تدعم تشغيل الكود الخادمي — وليس مجرد استضافة ملفات ثابتة.

## أولاً: ربط المشروع بـ GitHub

الربط يتم من داخل محرر Lovable (خطوة يدوية لا يقوم بها الذكاء الاصطناعي):

1. افتح **إعدادات المشروع ← Git** (أو من قائمة **+** بجانب مربع المحادثة ← Project ← GitHub).
2. اختر **Connect** ووافق على الأذونات — سيُنشأ مستودع خاص جديد باسم المشروع.
3. من هناك فصاعدًا يُزامَن كل تعديل تلقائيًا مع المستودع.

ملاحظات:
- الربط ينشئ مستودعًا جديدًا فقط؛ لا يمكن ربط مستودع موجود مسبقًا.
- المزامنة تعمل مع الفرع الافتراضي فقط.
- حذف المستودع على GitHub يوقف المزامنة.

## محتويات المستودع

| المسار | الوصف |
|---|---|
| `src/` | كود الموقع كاملًا (React + TanStack Start) |
| `public/` | ملفات ثابتة (شعارات الشركات، favicon، robots) |
| `src/assets/` | الصور والشعارات |
| `drizzle/migrations/` | هجرات قاعدة البيانات (الهيكل المعتمد) |
| `database/schema.sql`, `seed_data.sql`, `insurance_offers_current.sql` | نسخ مرجعية من قاعدة البيانات |
| `.env.example` | قالب متغيرات البيئة |

> تنبيه أمني: بيانات العملاء والبطاقات وسجلات الزيارات غير مشمولة عمدًا. لا ترفع أبدًا مفتاح `SUPABASE_SERVICE_ROLE_KEY` أو `DATA_ENCRYPTION_KEY` داخل الكود — تُضاف كمتغيرات بيئة سرية فقط.

## ثانيًا: إعدادات البناء

المتطلبات: Node.js 20+ أو Bun.

```bash
bun install     # أو npm install
bun run dev     # تشغيل محلي على http://localhost:8080
bun run build   # بناء الإنتاج
bun run test    # اختبارات المشروع (17 اختبارًا)
```

متغيرات البيئة المطلوبة قبل التشغيل (انسخها من `.env.example`):

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
VITE_SUPABASE_PROJECT_ID=<project-id>
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # سر — لا يوضع في الكود
DATA_ENCRYPTION_KEY=<64-hex-chars>             # سر — لا يوضع في الكود
```

ملاحظة: مفتاح النشر (publishable) علني بطبيعته، أما مفتاح الخدمة ومفتاح التشفير فهما سريان.

## ثالثًا: أين يُستضاف؟

| الخيار | مدعوم؟ | ملاحظات |
|---|---|---|
| **Lovable Publish** | ✅ الأفضل | بضغطة زر، ويثبّت قاعدة البيانات والمفاتيح تلقائيًا |
| Cloudflare Workers | ✅ | الإعداد الافتراضي للبناء في هذا القالب (Nitro) |
| Vercel / Netlify | ✅ | يدعمان Nitro عبر محول | 
| GitHub Pages | ❌ | استضافة ملفات ثابتة فقط — لن تعمل دوال الخادم ولا SSR |

### النشر على Cloudflare بعد المزامنة

```bash
bun run build
npx wrangler deploy
```

ثم أضف متغيرات البيئة السرية في لوحة Cloudflare (Workers ← Settings ← Variables) بدل ملف `.env`.

### تشغيل قاعدة البيانات على مزود جديد

```bash
psql "<DATABASE_URL>" -f database/schema.sql
psql "<DATABASE_URL>" -f database/seed_data.sql
psql "<DATABASE_URL>" -f database/insurance_offers_current.sql
```

## رابعًا: حساب المدير

أنشئ الحساب من صفحة `/auth`، ثم امنحه صلاحية المدير من قاعدة البيانات:

```sql
insert into public.user_roles (user_id, role)
values ('<user-uuid>', 'admin');
```
