import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { IntakeShell, Field, SelectField, submitMedical } from "@/components/InsuranceIntakeForm";

export const Route = createFileRoute("/medical")({
  head: () => ({
    meta: [
      { title: "التأمين الطبي | بي كير" },
      { name: "description", content: "قارن بين عروض التأمين الطبي من كبرى الشركات السعودية" },
      { property: "og:title", content: "التأمين الطبي | بي كير" },
      { property: "og:description", content: "قارن بين عروض التأمين الطبي من كبرى الشركات السعودية" },
    ],
  }),
  component: MedicalPage,
});

function MedicalPage() {
  useVisitorTracking("بيانات طبي");
  return (
    <PublicLayout showHero title="التأمين الطبي" subtitle="عبّئ البيانات لتظهر لك أفضل العروض">
      <IntakeShell
        kind="medical"
        title="بيانات التأمين الطبي"
        subtitle="بيانات مختصرة للحصول على عرض مناسب"
        onSubmit={submitMedical}
      >
        <Field label="الاسم الكامل" name="full_name" required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="الجوال" name="phone" required inputMode="tel" placeholder="05xxxxxxxx" />
          <Field label="البريد الإلكتروني" name="email" type="email" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="العمر" name="age" type="number" min={0} max={120} required />
          <Field label="عدد المؤمّنين" name="num_insured" type="number" min={1} max={50} required />
        </div>
        <Field label="شركة التأمين الحالية (اختياري)" name="current_insurer" />
        <SelectField
          label="نوع التغطية"
          name="coverage_type"
          required
          options={["أساسي", "متوسط", "شامل", "VIP"]}
        />
        <Field label="الميزانية التقريبية (اختياري)" name="budget" inputMode="numeric" placeholder="ر.س" />
      </IntakeShell>
    </PublicLayout>
  );
}
