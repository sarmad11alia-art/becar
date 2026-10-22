import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { useEffect, useState } from "react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { CheckCircle2, Download, Home } from "lucide-react";

export const Route = createFileRoute("/confirmation")({
  head: () => ({
    meta: [
      { title: "تم إصدار الوثيقة | بي كير" },
      { name: "description", content: "تم الدفع بنجاح وإصدار وثيقة التأمين" },
      { property: "og:title", content: "تم إصدار الوثيقة | بي كير" },
      { property: "og:description", content: "تم الدفع بنجاح وإصدار وثيقة التأمين" },
    ],
  }),
  component: ConfirmationPage,
});

type SelectedOffer = {
  company_name: string;
  company_logo_url: string | null;
  type: string;
  total: number;
};

const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function ConfirmationPage() {
  useVisitorTracking("تأكيد إصدار الوثيقة");
  const [offer, setOffer] = useState<SelectedOffer | null>(null);
  const [policyNo, setPolicyNo] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("bcare_selected_offer");
      if (raw) setOffer(JSON.parse(raw) as SelectedOffer);
    } catch {
      /* ignore */
    }
    setPolicyNo(`BC-${Math.floor(100000 + Math.random() * 900000)}`);
  }, []);

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-xl px-3 py-10">
        <div className="overflow-hidden rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-9 w-9 text-emerald-500" />
          </div>
          <h1 className="mb-1 text-xl font-black text-bcare-ink">تم إصدار الوثيقة بنجاح</h1>
          <p className="mb-5 text-sm text-slate-500">
            شكراً لثقتك في بي كير. تم تأكيد عملية الدفع وإصدار وثيقة التأمين الخاصة بك.
          </p>

          <div className="mb-5 rounded-2xl bg-bcare-surface p-4 text-sm">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">رقم الوثيقة</span>
              <span className="font-black text-bcare-blue" dir="ltr">{policyNo}</span>
            </div>
            {offer && (
              <>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">شركة التأمين</span>
                  <span className="font-bold text-bcare-blue">{offer.company_name}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">نوع التأمين</span>
                  <span className="font-bold text-bcare-blue">{offer.type}</span>
                </div>
                <div className="flex justify-between border-t border-bcare-border py-1.5">
                  <span className="font-bold text-slate-600">المبلغ المدفوع</span>
                  <span className="font-black text-bcare-orange">{money(offer.total)} ريال</span>
                </div>
              </>
            )}
          </div>

          <p className="mb-5 text-xs text-slate-400">
            ستصلك نسخة من الوثيقة على جوالك وبريدك الإلكتروني خلال دقائق.
          </p>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-bcare-blue font-bold text-white hover:bg-bcare-blue-dark"
            >
              <Download className="h-4 w-4" />
              تحميل الوثيقة
            </button>
            <Link
              to="/"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-bcare-surface font-bold text-bcare-blue hover:bg-bcare-border"
            >
              <Home className="h-4 w-4" />
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
