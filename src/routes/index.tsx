import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { FeatureStrip, HowItWorks, Faq } from "@/components/HomeSections";
import { useState } from "react";
import { createQuote } from "@/lib/quotes.functions";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { getOrCreateSessionId, mergeVisitorData } from "@/lib/visitor-session";
import { ArrowLeft, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "تأمين المركبات أونلاين | بي كير للتأمين" },
      {
        name: "description",
        content:
          "قارن أسعار تأمين المركبات بين أكثر من 20 شركة تأمين سعودية معتمدة، واستلم وثيقتك الإلكترونية في دقائق.",
      },
      { property: "og:title", content: "تأمين المركبات أونلاين | بي كير للتأمين" },
      {
        property: "og:description",
        content: "قارن، أمّن، واستلم وثيقتك في دقائق — أكثر من 20 شركة تأمين في مكان واحد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  useVisitorTracking("الرئيسية");
  const [transferOwnership, setTransferOwnership] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError("");
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Reuse the visitor's persistent session id so repeat submissions
    // append to the same record instead of creating a new visitor.
    const sessionId = getOrCreateSessionId();

    const payload = {
      session_id: sessionId,
      ssn: String(formData.get("ssn") ?? ""),
      seller_ssn: transferOwnership ? String(formData.get("seller_ssn") ?? "") : undefined,
      is_transfer: transferOwnership,
      id_type: "istimara",
      serial_number: String(formData.get("serial_number") ?? ""),
      ip_address: undefined,
      user_agent: navigator.userAgent,
    };
    mergeVisitorData(payload);

    try {
      await createQuote({ data: payload });
      window.location.href = "/details";
    } catch {
      setSubmitError("تعذر إرسال البيانات، يرجى المحاولة مرة أخرى.");
      setLoading(false);
    }
  };

  return (
    <PublicLayout showHero>
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-xl">
          <div className="bcare-card overflow-hidden ring-1">
            <div className="border-b border-bcare-border bg-bcare-surface/70 px-5 pb-4 pt-5">
              <h2 className="text-lg font-black text-bcare-ink">احصل على عروض أسعار المركبة</h2>
              <p className="mt-1 text-xs text-bcare-muted">
                البيانات المطلوبة قليلة — والنتيجة فورية.
              </p>
            </div>

            <div className="px-5 pt-5">
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setTransferOwnership(false)}
                  className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
                    !transferOwnership
                      ? "bg-white text-bcare-blue shadow-soft"
                      : "text-slate-500 hover:text-bcare-blue"
                  }`}
                >
                  تأمين جديد
                </button>
                <button
                  type="button"
                  onClick={() => setTransferOwnership(true)}
                  className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
                    transferOwnership
                      ? "bg-white text-bcare-blue shadow-soft"
                      : "text-slate-500 hover:text-bcare-blue"
                  }`}
                >
                  نقل ملكية
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5 md:p-6">
              {transferOwnership && (
                <div className="bcare-fade-up">
                  <label className="bcare-label">رقم هوية البائع</label>
                  <input
                    name="seller_ssn"
                    type="text"
                    minLength={10}
                    maxLength={10}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="bcare-field"
                    placeholder="١٠ أرقام"
                  />
                </div>
              )}

              <div>
                <label className="bcare-label">رقم الهوية / الإقامة</label>
                <input
                  name="ssn"
                  type="text"
                  required
                  minLength={10}
                  maxLength={10}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  className="bcare-field"
                  placeholder="١٠ أرقام"
                />
              </div>

              <div>
                <label className="bcare-label">نوع وثيقة المركبة</label>
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-bcare-blue py-2.5 text-white shadow-soft">
                    <input type="radio" name="id_type" defaultChecked className="h-3.5 w-3.5 accent-white" />
                    <span className="text-sm font-bold">استمارة</span>
                  </label>
                  <label className="flex cursor-not-allowed items-center justify-center gap-2 rounded-lg py-2.5 text-slate-400">
                    <input type="radio" name="id_type" disabled className="h-3.5 w-3.5" />
                    <span className="text-sm font-bold">بطاقة جمركية</span>
                  </label>
                </div>
              </div>


              <div>
                <label className="bcare-label">الرقم التسلسلي</label>
                <input
                  name="serial_number"
                  type="text"
                  required
                  className="bcare-field"
                  placeholder="الرقم التسلسلي"
                />
              </div>

              {submitError && (
                <p role="alert" className="text-center text-sm font-bold text-destructive">
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="bcare-gradient-cta mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-white shadow-glow-orange transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
              >
                {loading ? "جاري التحميل..." : "احصل على عروض الأسعار"}
                {!loading && <ArrowLeft className="h-4 w-4" />}
              </button>

              <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11px] text-slate-400">
                <Lock className="h-3 w-3" />
                بياناتك مشفّرة — بمتابعتك أنت توافق على شروط الاستخدام وسياسة الخصوصية
              </p>
            </form>
          </div>
        </div>
      </div>

      <FeatureStrip />
      <HowItWorks />
      <Faq />
    </PublicLayout>
  );
}
