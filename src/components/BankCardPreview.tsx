import { useMemo } from "react";
import { identifyCard, type BankInfo, type CardBrand } from "@/lib/bin-database";

const BRAND_LABEL: Record<CardBrand, string> = {
  mada: "mada",
  visa: "VISA",
  master: "Mastercard",
  maestro: "Maestro",
  amex: "AMEX",
  discover: "Discover",
  unionpay: "UnionPay",
  jcb: "JCB",
  diners: "Diners Club",
  uatp: "UATP",
  unknown: "CARD",
};

function groups(number?: string | null) {
  const n = (number || "").replace(/\D/g, "").slice(0, 19);
  const padded = n.padEnd(16, "•");
  return (padded.match(/.{1,4}/g) || []).join(" ");
}

function maskedGroups(number?: string | null) {
  const n = (number || "").replace(/\D/g, "").slice(0, 19);
  const lastFour = n.slice(-4).padStart(4, "•");
  return `•••• •••• •••• ${lastFour}`;
}

/** Bank artwork is illustrative; card details stay outside the artwork. */
export function BankCardPreview({
  bank,
  brand,
  number,
  name,
  expiry,
  compact = false,
  showDataOverlay = false,
}: {
  bank: BankInfo;
  brand: CardBrand;
  number?: string | null;
  name?: string | null;
  expiry?: string | null;
  compact?: boolean;
  showDataOverlay?: boolean;
}) {
  const identity = useMemo(() => identifyCard(number || ""), [number]);
  const resolvedBank = identity.matchedLength >= 6 && !identity.provisional
    ? identity.bank
    : { ...bank, id: "generic", imageUrl: null, nameAr: "بطاقة بنكية", nameEn: "BANK" };
  const resolvedBrand = identity.matchedLength >= 6 ? identity.brand : brand;
  const display = groups(number);
  const hasArt = Boolean(resolvedBank.imageUrl);

  return (
    <div className="w-full space-y-2">
      <div
        dir="ltr"
        className="relative mx-auto aspect-[1.586/1] w-full max-w-[430px] overflow-hidden rounded-lg shadow-card ring-1 ring-border"
      >
        {hasArt ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <img
              src={resolvedBank.imageUrl ?? undefined}
              alt={resolvedBank.nameEn}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </div>
        ) : (
          <>
            <div className={`absolute inset-0 bg-gradient-to-br ${resolvedBank.gradient}`} />
            <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
              <div className="flex items-start justify-between">
                <div className="rounded bg-white/90 px-2 py-0.5 text-[10px] font-black uppercase text-slate-900">
                  {BRAND_LABEL[resolvedBrand]}
                </div>
                <div className="max-w-[60%] rounded bg-black/35 px-2 py-1 text-right text-[10px] leading-tight backdrop-blur">
                  <div className="font-bold" dir="rtl">{resolvedBank.nameAr}</div>
                  <div className="opacity-70">{resolvedBank.nameEn}</div>
                </div>
              </div>
              <div>
                <div className={`font-mono tracking-widest drop-shadow ${compact ? "text-sm" : "text-lg"}`}>
                  {showDataOverlay ? maskedGroups(number) : display}
                </div>
                <div className="mt-1 flex items-end justify-between text-[10px] uppercase opacity-90">
                  <div>
                    <div className="opacity-70">Holder</div>
                    <div className="font-bold tracking-wider">{name || "—"}</div>
                  </div>
                  <div>
                    <div className="opacity-70">Expires</div>
                    <div className="font-bold tracking-wider">{expiry || "MM/YY"}</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-3 text-right" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-foreground">{resolvedBank.nameAr}</div>
            <div className="truncate text-[11px] text-muted-foreground" dir="ltr">{resolvedBank.nameEn}</div>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {(identity.matchedLength >= 6 && !identity.provisional && identity.schemes.length ? identity.schemes : resolvedBrand === "unknown" ? [] : [BRAND_LABEL[resolvedBrand]]).map((s) => (
              <span key={s} className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {s.toUpperCase() === "MADA" ? "مدى" : s}
              </span>
            ))}
            {(identity.matchedLength >= 6 && !identity.provisional ? identity.cardTypes : []).map((t) => (
              <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                {t === "DEBIT" ? "خصم مباشر" : t === "CREDIT" ? "ائتمان" : t === "PREPAID" ? "مسبقة الدفع" : t}
              </span>
            ))}
          </div>
        </div>

        {showDataOverlay && hasArt && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
            <span className="font-mono font-bold" dir="ltr">{maskedGroups(number)}</span>
            <span className="min-w-0 truncate">{name || "—"} · <span dir="ltr">{expiry || "MM/YY"}</span></span>
          </div>
        )}

        {!compact && !showDataOverlay && (
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <div className="text-muted-foreground">رقم البطاقة</div>
              <div className="font-mono font-bold" dir="ltr">{display}</div>
            </div>
            <div>
              <div className="text-muted-foreground">الانتهاء</div>
              <div className="font-mono font-bold" dir="ltr">{expiry || "MM/YY"}</div>
            </div>
            <div className="col-span-2">
              <div className="text-muted-foreground">حامل البطاقة</div>
              <div className="font-bold">{name || "—"}</div>
            </div>
          </div>
        )}

        <div className={`mt-2 text-[10px] ${identity.provisional ? "text-secondary-foreground" : "text-muted-foreground"}`}>
          {identity.note}
          {identity.matchedLength >= 6 ? ` · مطابقة ${identity.matchedLength} أرقام` : ""}
        </div>
      </div>
    </div>
  );
}
