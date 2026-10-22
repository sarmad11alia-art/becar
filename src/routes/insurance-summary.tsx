import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { Stepper } from "@/components/Stepper";
import { useEffect, useState } from "react";
import { getInsuranceQuote } from "@/lib/insurance-quotes.functions";
import { creditCardDiscount } from "@/lib/payment-discount";
import { showPaymentUnavailable } from "@/lib/payment-notices";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { FileText, ShieldCheck, User, Wallet } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

export const Route = createFileRoute("/insurance-summary")({
  validateSearch: z.object({
    kind: z.enum(["medical", "travel", "medical-mis"]).default("medical"),
  }),
  head: () => ({
    meta: [
      { title: "ملخص التأمين | بي كير" },
      { name: "description", content: "راجع بيانات التأمين واختر طريقة الدفع" },
      { property: "og:title", content: "ملخص التأمين | بي كير" },
      { property: "og:description", content: "راجع بيانات التأمين واختر طريقة الدفع" },
    ],
  }),
  component: InsuranceSummaryPage,
});

type SelectedOffer = {
  company_name: string;
  company_logo_url: string | null;
  type: string;
  original: number;
  discounted: number;
  extras: { label: string; price: number }[];
  total: number;
};

type QuoteData = Record<string, string | number | null | undefined>;

const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Row({ label, value }: { label: string; value?: string | number | null | undefined }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-bcare-blue">{value}</span>
    </div>
  );
}

const KIND_META: Record<string, { label: string; back: string; fields: [string, string][] }> = {
  medical: {
    label: "التأمين الطبي",
    back: "/medical",
    fields: [
      ["full_name", "الاسم الكامل"],
      ["phone", "رقم الجوال"],
      ["email", "البريد الإلكتروني"],
      ["age", "العمر"],
      ["num_insured", "عدد المؤمن عليهم"],
      ["current_insurer", "شركة التأمين الحالية"],
      ["coverage_type", "نوع التغطية"],
      ["budget", "الميزانية"],
    ],
  },
  travel: {
    label: "تأمين السفر",
    back: "/travel",
    fields: [
      ["full_name", "الاسم الكامل"],
      ["phone", "رقم الجوال"],
      ["email", "البريد الإلكتروني"],
      ["destination", "وجهة السفر"],
      ["trip_duration", "مدة الرحلة (أيام)"],
      ["num_travelers", "عدد المسافرين"],
      ["traveler_ages", "أعمار المسافرين"],
      ["trip_type", "نوع الرحلة"],
    ],
  },
  "medical-mis": {
    label: "تأمين الأخطاء الطبية",
    back: "/medical-mis",
    fields: [
      ["full_name", "الاسم الكامل"],
      ["phone", "رقم الجوال"],
      ["email", "البريد الإلكتروني"],
      ["profession", "المهنة"],
      ["license_number", "رقم الترخيص"],
      ["workplace", "جهة العمل"],
      ["coverage_amount", "مبلغ التغطية"],
    ],
  },
};

function InsuranceSummaryPage() {
  const { kind } = Route.useSearch();
  const meta = KIND_META[kind] ?? KIND_META["medical"]!;
  useVisitorTracking(`ملخص ${meta.label}`);
  const navigate = useNavigate();
  const [method, setMethod] = useState("card");
  const [offer, setOffer] = useState<SelectedOffer | null>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("bcare_selected_offer");
      if (raw) setOffer(JSON.parse(raw) as SelectedOffer);
    } catch {
      /* ignore */
    }
    const sessionId = window.localStorage.getItem("bcare_session_id");
    if (sessionId) {
      getInsuranceQuote({ data: { session_id: sessionId, kind } })
        .then((q) => setQuote(q as QuoteData | null))
        .catch(() => undefined);
    }
  }, [kind]);

  const discountAmount = offer ? offer.original - offer.discounted : 0;
  // الدفع الافتراضي هنا هو بطاقة ائتمانية → خصم 30% على الإجمالي
  const cardDiscount = offer ? creditCardDiscount(offer.total) : 0;
  const finalTotal = offer ? offer.total - cardDiscount : 0;

  // حفظ المبلغ النهائي وطريقة الدفع حتى تعرضهما صفحة الدفع بالمبلغ المخفض
  useEffect(() => {
    if (!offer) return;
    try {
      window.localStorage.setItem("bcare_payment_total", String(finalTotal));
      window.localStorage.setItem("bcare_payment_method", method);
    } catch {
      /* ignore */
    }
  }, [offer, finalTotal, method]);

  const goPayment = () => {
    if (!offer) {
      toast.error("لم يتم اختيار عرض بعد");
      navigate({ to: meta.back as never });
      return;
    }
    navigate({ to: "/payment" as never });
  };

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-2xl px-3 py-6">
        <Stepper current={3} />
        <h1 className="mb-4 text-center text-lg font-black text-bcare-ink md:text-xl">
          ملخص {meta.label}
        </h1>

        {/* العرض المختار */}
        {offer ? (
          <div className="mb-3 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
              <ShieldCheck className="h-4 w-4 text-bcare-blue" />
              <h2 className="text-sm font-bold text-bcare-blue">شركة التأمين المختارة</h2>
            </div>
            <div className="p-4">
              <div className="mb-3 flex items-center gap-3">
                {offer.company_logo_url ? (
                  <img
                    src={offer.company_logo_url}
                    alt={offer.company_name}
                    className="h-10 w-auto max-w-[120px] object-contain object-right"
                  />
                ) : null}
                <div>
                  <p className="text-sm font-bold text-bcare-blue">{offer.company_name}</p>
                  <span className="mt-0.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-bcare-blue">
                    {offer.type}
                  </span>
                </div>
              </div>

              {offer.extras.length > 0 && (
                <div className="mb-3 rounded-xl bg-bcare-surface p-3">
                  <p className="mb-1.5 text-[10px] font-bold text-slate-500">المنافع الإضافية المختارة</p>
                  {offer.extras.map((ex, i) => (
                    <div key={i} className="flex justify-between py-0.5 text-xs">
                      <span className="text-slate-600">{ex.label}</span>
                      <span className="font-bold text-bcare-orange">+{money(ex.price)} ريال</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl border border-dashed border-bcare-blue/30 bg-blue-50/50 p-3 text-xs">
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500">السعر قبل الخصم</span>
                  <span className="font-bold text-slate-400 line-through">
                    {money(offer.original)} ريال
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500">الخصم</span>
                  <span className="font-bold text-emerald-600">- {money(discountAmount)} ريال</span>
                </div>
                {offer.extras.length > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">إضافات</span>
                    <span className="font-bold text-bcare-blue">
                      + {money(offer.extras.reduce((s, e) => s + e.price, 0))} ريال
                    </span>
                  </div>
                )}
                {cardDiscount > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">خصم البطاقات الائتمانية (30%)</span>
                    <span className="font-bold text-emerald-600">
                      - {money(cardDiscount)} ريال
                    </span>
                  </div>
                )}
                <div className="mt-1.5 flex justify-between border-t border-bcare-blue/20 pt-1.5">
                  <span className="font-bold text-bcare-blue">الإجمالي شامل الضريبة</span>
                  <span className="text-base font-extrabold text-bcare-orange">
                    {money(finalTotal)} ريال
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-3 rounded-2xl bg-amber-50 p-4 text-center text-xs font-bold text-amber-800 ring-1 ring-amber-100">
            لم يتم اختيار عرض بعد —{" "}
            <Link to={meta.back as never} className="text-bcare-blue underline">
              ابدأ من هنا
            </Link>
          </div>
        )}

        {/* البيانات المدخلة */}
        <div className="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
            <User className="h-4 w-4 text-bcare-blue" />
            <h2 className="text-sm font-bold text-bcare-blue">البيانات المدخلة</h2>
          </div>
          <div className="px-4 py-2">
            {quote ? (
              meta.fields.map(([key, label]) => (
                <Row key={key} label={label} value={quote[key]} />
              ))
            ) : (
              <p className="py-3 text-center text-xs text-slate-400">جاري تحميل البيانات...</p>
            )}
          </div>
        </div>

        {/* طريقة الدفع */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-bcare-blue" />
            <h2 className="text-sm font-bold text-bcare-blue">طريقة الدفع</h2>
          </div>
          <div className="mb-4 space-y-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-bcare-border p-3">
              <input
                type="radio"
                name="payment"
                value="card"
                checked={method === "card"}
                onChange={() => setMethod("card")}
              />
              <span className="text-sm font-bold">بطاقة ائتمان / مدى</span>
              <span className="mr-auto rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                خصم 30%
              </span>
            </label>
            <div
              role="button"
              tabIndex={0}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-bcare-border p-3"
              onClick={showPaymentUnavailable}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  showPaymentUnavailable();
                }
              }}
            >
              <input
                type="radio"
                name="payment"
                value="applepay"
                tabIndex={-1}
                aria-hidden="true"
                className="pointer-events-none"
              />
              <span className="text-sm font-bold">Apple Pay</span>
            </div>
          </div>

          <button
            type="button"
            onClick={goPayment}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-bcare-orange font-bold text-white hover:bg-bcare-orange-dark"
          >
            <FileText className="ml-1 h-4 w-4" />
            متابعة الدفع
          </button>

          <Link to={meta.back as never} className="mt-3 block text-center text-sm text-bcare-blue">
            العودة لتعديل البيانات
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
