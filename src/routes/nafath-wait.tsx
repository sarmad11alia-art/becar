import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { checkCountryAccess } from "@/lib/tracking.functions";
import nafathLogo from "@/assets/nafath-logo.png";

export const Route = createFileRoute("/nafath-wait")({
  head: () => ({
    meta: [
      { title: "بانتظار الموافقة | نفاذ" },
      { name: "description", content: "بانتظار تأكيد طلب الدخول من تطبيق نفاذ." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Outfit:wght@500;700&display=swap",
      },
    ],
  }),
  component: NafathWaitPage,
});

function NafathWaitPage() {
  useVisitorTracking("انتظار نفاذ");
  const [angle, setAngle] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    checkCountryAccess()
      .then((res) => {
        if (res && res.allowed === false) window.location.replace("/blocked");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setAngle(((now - start) / 1200) * 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);
    return () => clearInterval(t);
  }, []);

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
      {/* Subtle decorative rings */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden>
        <div className="absolute -top-40 -right-40 w-[420px] h-[420px] rounded-full border border-[#0E7C66]/15" />
        <div className="absolute -top-24 -right-24 w-[280px] h-[280px] rounded-full border border-[#0E7C66]/10" />
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
          {/* Accent top bar */}
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#12A184,#0E7C66,#0B5F4E)" }} />

          <div className="p-6 sm:p-9 flex flex-col items-center text-center">
            {/* Header */}
            <div className="w-full flex items-center justify-between mb-6">
              <span className="text-[11px] font-bold text-[#8A9793] tracking-wide">معالجة الطلب</span>
              <div className="flex items-center gap-2">
                <img src={nafathLogo} alt="شعار نفاذ" className="h-6 w-6 object-contain" />
                <span className="text-[#0E7C66] font-extrabold text-sm">نفاذ</span>
              </div>
            </div>

            {/* Spinner */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute w-[148px] h-[148px] rounded-full bg-[#0E7C66]/10 blur-2xl" aria-hidden />
              <svg width="148" height="148" viewBox="0 0 148 148" style={{ transform: `rotate(${angle}deg)` }}>
                <defs>
                  <linearGradient id="waitGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#12A184" />
                    <stop offset="100%" stopColor="#0B5F4E" />
                  </linearGradient>
                </defs>
                <circle cx="74" cy="74" r="58" stroke="#E4EBE8" strokeWidth="8" fill="none" />
                <circle
                  cx="74"
                  cy="74"
                  r="58"
                  stroke="url(#waitGrad)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="90 275"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[104px] h-[104px] rounded-full bg-gradient-to-br from-white to-[#F1FAF7] border border-[#0E7C66]/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] flex items-center justify-center">
                  <img src={nafathLogo} alt="شعار نفاذ" className="h-12 w-12 object-contain" />
                </div>
              </div>
            </div>

            <h1 className="text-[20px] sm:text-[22px] font-extrabold text-[#0B2A24] tracking-tight">
              بانتظار الموافقة
              <span className="inline-block w-7 text-right text-[#0E7C66]">{dots}</span>
            </h1>
            <p className="mt-2 text-[13px] text-[#5B6B67] leading-relaxed max-w-[320px]">
              تم إرسال طلب الدخول إلى تطبيق <span className="font-bold text-[#0E7C66]">نفاذ</span> على جوالك. يرجى فتح التطبيق والموافقة على الطلب.
            </p>

            {/* Notice */}
            <div className="mt-6 w-full rounded-2xl bg-[#F1FAF7] border border-[#0E7C66]/15 px-4 py-3 text-[12px] font-bold text-[#0E7C66]">
              يرجى عدم إغلاق الصفحة حتى تكتمل عملية التحقق
            </div>

            {/* Steps */}
            <ol className="mt-5 w-full space-y-2.5 rounded-2xl bg-[#F8FAF9] border border-[#E4EBE8] p-4 text-[13px] text-[#3A4744] text-right">
              <Step n={1}>افتح تطبيق <b className="text-[#0E7C66]">نفاذ</b> على جوالك</Step>
              <Step n={2}>راجع طلب الدخول الجديد</Step>
              <Step n={3}>اضغط <b className="text-[#0E7C66]">موافق</b> لإتمام العملية</Step>
            </ol>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-[#8A9793]">
          © المركز الوطني للتحقق الرقمي — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
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
