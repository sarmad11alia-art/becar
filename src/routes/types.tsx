import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { useEffect, useMemo, useState } from "react";
import { listOffers, calcOfferPricing, normalizeFeatures } from "@/lib/offers.functions";
import { getQuote } from "@/lib/quotes.functions";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { useInsuranceOffersRealtime } from "@/hooks/useInsuranceOffersRealtime";
import { Car, ShieldCheck, LayoutGrid, Check, ChevronLeft, Plus, Filter } from "lucide-react";

export const Route = createFileRoute("/types")({
  head: () => ({
    meta: [
      { title: "عروض التأمين | بي كير" },
      { name: "description", content: "قارن بين عروض أكثر من 20 شركة تأمين واختر الأنسب لمركبتك" },
      { property: "og:title", content: "عروض التأمين | بي كير" },
      { property: "og:description", content: "قارن بين عروض أكثر من 20 شركة تأمين واختر الأنسب لمركبتك" },
       { property: "og:type", content: "website" },
       { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TypesPage,
});

const offerTypes = [
  { key: "الكل", label: "الكل", Icon: LayoutGrid },
  { key: "شامل", label: "شامل", Icon: ShieldCheck },
  { key: "ضد الغير", label: "ضد الغير", Icon: Car },
];

type Feature = { label: string; price?: number; included?: boolean };

type Offer = {
  id: string;
  company_name: string;
  company_logo_url: string | null;
  type: string;
  price: number;
  rate: number | null;
  min_price: number | null;
  features: Feature[] | string[] | null;
};


const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function OfferCard({ offer, carValue }: { offer: Offer; carValue: number }) {
  const features = useMemo(() => normalizeFeatures(offer.features), [offer.features]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  // المعادلة الرسمية على الخادم: السعر الأساسي حسب قيمة المركبة (شامل وضد الغير)
  const pricing = useMemo(() => calcOfferPricing(offer, carValue), [offer, carValue]);
  const original = pricing.original;
  const discounted = pricing.discounted;
  const extras = features.reduce(
    (sum, f, i) => sum + (checked[i] && !f.included ? Number(f.price ?? 0) : 0),
    0,
  );
  const total = discounted + extras;

  const toggle = (i: number) => {
    if (features[i]?.included) return;
    setChecked((s) => ({ ...s, [i]: !s[i] }));
  };

  const selectOffer = () => {
    const selectedExtras = features
      .map((f, i) => ({ ...f, on: !!checked[i] }))
      .filter((f) => !f.included && f.on);
    window.localStorage.setItem(
      "bcare_selected_offer",
      JSON.stringify({
        offer_id: offer.id,
        company_name: offer.company_name,
        company_logo_url: offer.company_logo_url,
        type: offer.type,
        original,
        discounted,
        extras: selectedExtras.map((f) => ({ label: f.label, price: Number(f.price ?? 0) })),
        extra_labels: selectedExtras.map((f) => f.label),
        total,
        selected_at: new Date().toISOString(),
      }),
    );
  };

  return (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-bcare-blue/20">
      <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
        {/* الشعار والشركة */}
        <div className="flex shrink-0 items-center gap-3 sm:w-40 sm:flex-col sm:items-start sm:gap-2">
          <div className="flex h-11 items-center rounded-xl bg-slate-50 px-3 py-1.5 ring-1 ring-slate-100">
            {offer.company_logo_url ? (
              <img
                src={offer.company_logo_url}
                alt={offer.company_name}
                loading="lazy"
                className="h-8 w-auto max-w-[110px] object-contain object-right"
              />
            ) : (
              <span className="text-sm font-bold text-bcare-blue">{offer.company_name}</span>
            )}
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              offer.type === "شامل"
                ? "bg-bcare-blue/10 text-bcare-blue"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {offer.type}
          </span>
        </div>

        <div className="hidden h-16 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent sm:block" />

        {/* المنافع */}
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-black text-bcare-ink">{offer.company_name}</p>
          <div className="mb-2 flex items-center gap-1">
            <Plus className="h-3 w-3 text-bcare-blue" />
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              المنافع الإضافية
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {features.map((f, i) => {
              const on = f.included || !!checked[i];
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggle(i)}
                  aria-pressed={on}
                  disabled={!!f.included}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all ${
                    on
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-500 hover:border-bcare-blue/40 hover:bg-blue-50/40 hover:text-bcare-blue"
                  } ${f.included ? "cursor-default" : "cursor-pointer"}`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      on ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"
                    }`}
                  >
                    {on && <Check className="h-2 w-2" strokeWidth={3.5} />}
                  </span>
                  <span className="whitespace-nowrap">{f.label}</span>
                  {!f.included && f.price ? (
                    <span className="text-bcare-orange">+{f.price}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden h-16 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent sm:block" />

        {/* السعر والشراء */}
        <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-slate-50/70 p-2.5 sm:flex sm:w-44 sm:flex-col sm:items-stretch sm:justify-center sm:gap-2">
          <div className="text-right sm:text-center">
            <p className="text-[10px] text-slate-400">الإجمالي شامل الضريبة</p>
            <div className="flex items-baseline justify-end gap-1.5 sm:justify-center">
              <span className="text-[10px] font-bold text-slate-400 line-through">
                {money(original)}
              </span>
              <p className="text-lg font-extrabold text-bcare-blue">
                {money(total)} <span className="text-[10px] font-bold">ريال</span>
              </p>
            </div>
            <span className="mt-0.5 inline-block rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
              خصم ١٠٪
            </span>
          </div>
          <Link
            to="/summary"
            search={{ offer: offer.id, total: total.toFixed(2) } as never}
            onClick={selectOffer}
            className="flex items-center justify-center gap-1 rounded-xl bg-gradient-to-l from-bcare-orange to-[#ffb84a] px-4 py-2.5 text-[11px] font-bold text-white shadow-md shadow-bcare-orange/25 transition-transform hover:scale-[1.03] sm:text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>اشتري الآن</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function TypesPage() {
  useVisitorTracking("مقارنة العروض");
  const [activeType, setActiveType] = useState("الكل");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [carValue, setCarValue] = useState(0);
  const [offersRevision, setOffersRevision] = useState(0);

  useInsuranceOffersRealtime(() => setOffersRevision((revision) => revision + 1));

  useEffect(() => {
    const sessionId = window.localStorage.getItem("bcare_session_id");
    if (!sessionId) return;
    getQuote({ data: { session_id: sessionId } })
      .then((quote) => {
        const details = (
          quote as { quote_details?: { car_value?: number; created_at?: string }[] } | null
        )?.quote_details;
        // Every details submission is appended, so the newest entry is the
        // customer's current answer — read that, not the first one on file.
        const newest = Array.isArray(details)
          ? [...details]
              .sort((a, b) =>
                String(b?.created_at ?? "").localeCompare(String(a?.created_at ?? "")),
              )
              .find((d) => Number(d?.car_value ?? 0) > 0)
          : undefined;
        const value = Number(newest?.car_value ?? 0);
        if (value > 0) setCarValue(value);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listOffers({ data: activeType === "الكل" ? {} : { type: activeType } }).then((data) => {
      if (alive) {
        // عروض تأمين المركبات فقط: شامل وضد الغير
        const vehicle = (data as unknown as Offer[]).filter(
          (o) => o.type === "شامل" || o.type === "ضد الغير",
        );
        setOffers(vehicle);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [activeType, offersRevision]);

  // Keep the canonical server order: most-used insurers in Saudi Arabia first.
  const sorted = useMemo(() => offers, [offers]);

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-5xl px-3 py-6">
        <header className="bcare-card mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 ring-1 sm:p-5">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black text-bcare-ink md:text-xl">
              عروض تأمين المركبات
            </h1>
            <p className="mt-1 text-xs text-bcare-muted md:text-sm">
              {carValue > 0
                ? `الأسعار محسوبة على قيمة مركبة ${money(carValue)} ريال`
                : "قارن بين عروض أكثر من 20 شركة تأمين معتمدة"}
            </p>
             <p className="mt-1 text-xs text-bcare-muted">الأسعار تقديرية وليست عروضاً معتمدة من شركات التأمين.</p>
          </div>
          <div className="shrink-0 rounded-xl bg-bcare-surface px-3 py-2 text-center">
            <div className="text-lg font-black text-bcare-blue">{loading ? "…" : offers.length}</div>
            <div className="text-[10px] font-bold text-bcare-muted">عرض متاح</div>
          </div>
        </header>

        <div className="sticky top-2 z-30 mb-5 rounded-2xl bg-white/95 p-3 shadow-card ring-1 ring-black/5 backdrop-blur">
          <div className="mb-2 flex items-center gap-1.5 text-bcare-blue">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-bold">تصفية سريعة</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {offerTypes.map(({ key, label, Icon }) => {
              const active = activeType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveType(key)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                    active
                      ? "bcare-gradient-blue text-white shadow-soft"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-bcare-blue"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>


        {loading && (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-white/70" />
            ))}
          </div>
        )}

        {!loading && sorted.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-center text-xs text-bcare-muted shadow-sm">
            لا توجد عروض متاحة حالياً لهذا النوع.
          </div>
        )}

        <div className="space-y-2.5">
          {!loading &&
            sorted.map((offer) => (
              <OfferCard key={offer.id} offer={offer} carValue={carValue} />
            ))}
        </div>
      </div>
    </PublicLayout>
  );
}
