import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { IntakeShell, Field, SelectField, submitTravel } from "@/components/InsuranceIntakeForm";

export const Route = createFileRoute("/travel")({
  head: () => ({
    meta: [
      { title: "تأمين السفر | بي كير" },
      { name: "description", content: "قارن بين عروض تأمين السفر لدول العالم" },
      { property: "og:title", content: "تأمين السفر | بي كير" },
      { property: "og:description", content: "قارن بين عروض تأمين السفر لدول العالم" },
    ],
  }),
  component: TravelPage,
});

function TravelPage() {
  useVisitorTracking("بيانات سفر");
  return (
    <PublicLayout showHero title="تأمين السفر" subtitle="أدخل تفاصيل رحلتك لعرض الأسعار">
      <IntakeShell
        kind="travel"
        title="بيانات تأمين السفر"
        subtitle="اختر وجهتك والمدة لاحتساب السعر"
        onSubmit={submitTravel}
      >
        <Field label="الاسم الكامل" name="full_name" required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="الجوال" name="phone" required inputMode="tel" placeholder="05xxxxxxxx" />
          <Field label="البريد الإلكتروني" name="email" type="email" />
        </div>
        <Field label="الوجهة" name="destination" required placeholder="مثال: تركيا، شنغن، بريطانيا" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="مدة الرحلة (أيام)" name="trip_duration" type="number" min={1} max={365} required />
          <Field label="عدد المسافرين" name="num_travelers" type="number" min={1} max={20} required />
        </div>
        <Field label="أعمار المسافرين (اختياري)" name="traveler_ages" placeholder="مثال: 30, 28, 5" />
        <SelectField
          label="نوع الرحلة"
          name="trip_type"
          required
          options={["سياحة", "عمل", "دراسة", "علاج", "أخرى"]}
        />
      </IntakeShell>
    </PublicLayout>
  );
}
