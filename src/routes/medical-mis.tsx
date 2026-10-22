import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { IntakeShell, Field, submitMedicalMis } from "@/components/InsuranceIntakeForm";

export const Route = createFileRoute("/medical-mis")({
  head: () => ({
    meta: [
      { title: "تأمين الأخطاء الطبية | بي كير" },
      { name: "description", content: "تأمين مسؤولية الأخطاء الطبية للمهنيين الصحيين" },
      { property: "og:title", content: "تأمين الأخطاء الطبية | بي كير" },
      { property: "og:description", content: "تأمين مسؤولية الأخطاء الطبية للمهنيين الصحيين" },
    ],
  }),
  component: MedicalMisPage,
});

function MedicalMisPage() {
  useVisitorTracking("بيانات أخطاء طبية");
  return (
    <PublicLayout showHero title="تأمين الأخطاء الطبية" subtitle="حماية مهنية للمزاولين الصحيين">
      <IntakeShell
        kind="medical-mis"
        title="بيانات تأمين الأخطاء الطبية"
        subtitle="مطلوب من هيئة التخصصات الصحية"
        onSubmit={submitMedicalMis}
      >
        <Field label="الاسم الكامل" name="full_name" required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="الجوال" name="phone" required inputMode="tel" placeholder="05xxxxxxxx" />
          <Field label="البريد الإلكتروني" name="email" type="email" />
        </div>
        <Field label="المهنة / التخصص" name="profession" required placeholder="مثال: طبيب أسنان" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="رقم الترخيص" name="license_number" required />
          <Field label="جهة العمل" name="workplace" required />
        </div>
        <Field
          label="مبلغ التغطية المطلوب (ر.س)"
          name="coverage_amount"
          required
          inputMode="numeric"
          placeholder="مثال: 500000"
        />
      </IntakeShell>
    </PublicLayout>
  );
}
