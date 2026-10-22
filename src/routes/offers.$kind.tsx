import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { useEffect, useState } from "react";
import { listOffers } from "@/lib/offers.functions";
import { computeInsurancePrice, selectInsuranceOffer } from "@/lib/insurance-quotes.functions";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { useInsuranceOffersRealtime } from "@/hooks/useInsuranceOffersRealtime";
import { ShieldCheck, Check, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const KIND_META: Record<
  string,
  { label: string; type: string; page: string; back: string }
> = {
  medical: { label: "التأمين الطبي", type: "طبي", page: "مقارنة عروض الطبي", back: "/medical" },
  travel: { label: "تأمين السفر", type: "سفر", page: "مقارنة عروض السفر", back: "/travel" },
  "medical-mis": {
    label: "تأمين الأخطاء الطبية",
    type: "أخطاء طبية",
    page: "مقارنة عروض الأخطاء الطبية",
    back: "/medical-mis",
  },
};

export const Route = createFileRoute("/offers/$kind")({
  head: ({ params }) => {
    const m = KIND_META[params.kind] ?? KIND_META["medical"]!;
    return {
      meta: [
        { title: `عروض ${m.label} | بي كير` },
        { name: "description", content: `قارن بين عروض ${m.label} واختر الأنسب لك` },
        { property: "og:title", content: `عروض ${m.label} | بي كير` },
        { property: "og:description", content: `قارن بين عروض ${m.label} واختر الأنسب لك` },
         { property: "og:type", content: "website" },
         { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: OffersPage,
});

type Offer = {
  id: string;
  company_name: string;
  company_logo_url: string | null;
  type: string;
  features: unknown;
};

type Priced = { total: number; original: number; discounted: number };

const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function OffersPage() {
  const { kind } = useParams({ from: "/offers/$kind" });
  const meta = KIND_META[kind];
  useVisitorTracking(meta?.page ?? "مقارنة العروض");
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [prices, setPrices] = useState<Record<string, Priced>>({});
  const [loading, setLoading] = useState(true);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [offersRevision, setOffersRevision] = useState(0);

  useInsuranceOffersRealtime(() => setOffersRevision((revision) => revision + 1));

  useEffect(() => {
    if (!meta) return;
    let cancelled = false;
    (async () => {
      const list = (await listOffers({ data: { type: meta.type } })) as Offer[];
      if (cancelled) return;
      setOffers(list);
      setLoading(false);
      const sessionId = window.localStorage.getItem("bcare_session_id") ?? "";
      if (!sessionId) return;
      const priced: Record<string, Priced> = {};
      await Promise.all(
        list.map(async (o) => {
          try {
            const p = await computeInsurancePrice({
              data: { session_id: sessionId, kind: kind as "medical" | "travel" | "medical-mis", offer_id: o.id },
            });
            priced[o.id] = { total: p.total, original: p.original, discounted: p.discounted };
          } catch {
            /* ignore per-offer failure */
          }
        }),
      );
      if (!cancelled) setPrices(priced);
    })().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [kind, meta, offersRevision]);

  if (!meta) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12 text-center text-bcare-muted">نوع تأمين غير معروف</div>
      </PublicLayout>
    );
  }

  const pick = async (offer: Offer) => {
    const sessionId = window.localStorage.getItem("bcare_session_id");
    const p = prices[offer.id];
    if (!sessionId || !p) {
      toast.error("لم يتم تحميل السعر بعد");
      return;
    }
    setPickingId(offer.id);
    try {
      await selectInsuranceOffer({
        data: {
          session_id: sessionId,
          kind: kind as "medical" | "travel" | "medical-mis",
          offer_id: offer.id,
          price: p.total,
        },
      });
      window.localStorage.setItem(
        "bcare_selected_offer",
        JSON.stringify({
          offer_id: offer.id,
          company_name: offer.company_name,
          company_logo_url: offer.company_logo_url,
          type: offer.type,
          original: p.original,
          discounted: p.discounted,
          extras: [],
          extra_labels: [],
          total: p.total,
          selected_at: new Date().toISOString(),
        }),
      );
      navigate({ to: "/insurance-summary" as never, search: { kind } as never });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر اختيار العرض");
    } finally {
      setPickingId(null);
    }
  };

  return (
    <PublicLayout showHero title={`عروض ${meta.label}`} subtitle="اختر أفضل عرض يناسبك">
      <div className="container mx-auto px-4 py-6">
        <Link
          to={meta.back as "/medical"}
          className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-bcare-blue hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          تعديل البيانات
        </Link>
         <p className="mb-4 text-xs text-bcare-muted">الأسعار تقديرية وليست عروضاً معتمدة من شركات التأمين.</p>

        {loading ? (
          <div className="py-10 text-center text-bcare-muted">جاري تحميل العروض...</div>
        ) : offers.length === 0 ? (
          <div className="py-10 text-center text-bcare-muted">لا توجد عروض متاحة حالياً</div>
        ) : (
          <div className="grid gap-3">
            {offers.map((o) => {
              const p = prices[o.id];
              const feats = (Array.isArray(o.features) ? o.features : []) as (string | { label: string })[];
              return (
                <div
                  key={o.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-lg"
                >
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="flex shrink-0 items-center gap-3 sm:w-48">
                      <div className="flex h-11 items-center rounded-xl bg-slate-50 px-3 py-1.5 ring-1 ring-slate-100">
                        {o.company_logo_url ? (
                          <img
                            src={o.company_logo_url}
                            alt={o.company_name}
                            loading="lazy"
                            className="h-8 w-auto max-w-[110px] object-contain"
                          />
                        ) : (
                          <span className="text-sm font-bold text-bcare-blue">{o.company_name}</span>
                        )}
                      </div>
                      <span className="rounded-full bg-bcare-blue/10 px-2.5 py-0.5 text-[10px] font-bold text-bcare-blue">
                        {o.type}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1.5">
                        {feats.slice(0, 5).map((f, i) => {
                          const label = typeof f === "string" ? f : f.label;
                          return (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700"
                            >
                              <Check className="h-3 w-3" />
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="sm:w-40 sm:text-left">
                      <div className="text-[10px] font-bold text-slate-400">السعر</div>
                      <div className="text-lg font-black text-bcare-blue">
                        {p ? money(p.total) : "—"} <span className="text-xs">ر.س</span>
                      </div>
                      <button
                        type="button"
                        disabled={!p || pickingId === o.id}
                        onClick={() => pick(o)}
                        className="mt-2 inline-flex items-center gap-1 rounded-lg bg-bcare-orange px-4 py-2 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {pickingId === o.id ? "..." : "اختيار"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
