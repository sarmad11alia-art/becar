import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { InsuranceTabs } from "./InsuranceTabs";
import { useEffect, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { checkCountryAccess } from "@/lib/tracking.functions";
import { BadgeCheck, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function PublicLayout({
  children,
  showHero = false,
  title,
  subtitle,
}: {
  children: ReactNode;
  showHero?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const isHome = useRouterState({ select: (s) => s.location.pathname === "/" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname === "/blocked") return;
    checkCountryAccess()
      .then((res) => {
        if (res && res.allowed === false) {
          window.location.replace("/blocked");
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-bcare-surface" dir="rtl">
      {isHome && <Navbar />}



      {showHero && (
        <>
          <section className="bcare-hero-bg relative overflow-hidden text-white">
            <div className="container mx-auto px-4 pb-20 pt-10 text-center md:pb-24 md:pt-16">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur">
                <BadgeCheck className="h-3.5 w-3.5" />
                أكثر من 20 شركة تأمين معتمدة
              </span>
              <h1 className="bcare-fade-up mx-auto mt-4 max-w-3xl text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
                {title ?? "قارن، أمّن، واستلم وثيقتك في دقائق"}
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed opacity-90 md:text-base">
                {subtitle ??
                  "مكان واحد يوفّر عليك البحث والمقارنة — أدخل بياناتك مرة واحدة واحصل على أفضل الأسعار فورًا."}
              </p>

              <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] font-semibold opacity-90 md:text-sm">
                <li className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-bcare-orange" /> عرض سعر في أقل من دقيقة
                </li>
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-bcare-orange" /> دفع آمن ومشفّر
                </li>
                <li className="flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-bcare-orange" /> وثيقة إلكترونية فورية
                </li>
              </ul>
            </div>

            {/* soft wave divider */}
            <svg
              className="pointer-events-none absolute bottom-0 left-0 w-full text-bcare-surface"
              viewBox="0 0 1440 80"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0,40 C240,90 480,0 720,24 C960,48 1200,90 1440,44 L1440,80 L0,80 Z" fill="currentColor" />
            </svg>
          </section>

          <InsuranceTabs />
        </>
      )}

      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
